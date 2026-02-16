import amqp, { ConfirmChannel, Connection, ConsumeMessage } from 'amqplib';
import config from '../config';
import { setupCreditsBatchConsumer } from '../modules/credits-process/credits-process-batch.consumer';
import { setupCreditsProcessEndConsumer } from '../modules/credits-process/credits-process.consumer';
import { setupFeatureUsageLogConsumer } from '../modules/feature-usage-log/feature-usage-log.consumer';

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: ConfirmChannel | null = null;
  private isConnecting: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private consumers: Map<
    string,
    { handler: (data: any) => Promise<void>; options?: { prefetch?: number } }
  > = new Map();

  // Configuration Constants
  private readonly DLX_NAME = 'dlx_exchange';
  private readonly DLQ_SUFFIX = '_dlq';

  // Backoff configuration
  private retryCount = 0;
  private readonly MAX_RETRY_DELAY = 30000;
  private readonly INITIAL_RETRY_DELAY = 1000;

  constructor() {
    this.connect = this.connect.bind(this);
    this.handleConnectionError = this.handleConnectionError.bind(this);
    this.handleConnectionClose = this.handleConnectionClose.bind(this);
  }

  public async connect(): Promise<void> {
    if (!config.rabbitmq_enabled) {
      console.log('🐰 RabbitMQ is disabled via config.');
      return;
    }
    if (this.connection || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const rabbitUrl =
        config.rabbitmq_url || 'amqp://guest:guest@localhost:5672';
      console.log(`🐰 Attempting to connect to RabbitMQ...`);

      this.connection = (await amqp.connect(rabbitUrl)) as any;
      this.channel = await (this.connection as any).createConfirmChannel();

      console.log('✅ Connected to RabbitMQ');
      this.isConnecting = false;
      this.retryCount = 0;

      (this.connection as any).on('error', this.handleConnectionError);
      (this.connection as any).on('close', this.handleConnectionClose);

      await this.setupInfrastructure();
      await this.recoverConsumers();
    } catch (error: any) {
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }

  /**
   * Setup Exchanges and generic infrastructure
   */
  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) return;
    try {
      // Assert Dead Letter Exchange
      await this.channel.assertExchange(this.DLX_NAME, 'direct', {
        durable: true,
      });
      console.log('✅ RabbitMQ Infrastructure (DLX) verified');
    } catch (error) {
      console.error('❌ Failed to setup RabbitMQ infrastructure:', error);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await (this.connection as any).close();
      this.cleanup();
      console.log('🛑 RabbitMQ connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  private handleConnectionError(err: any): void {
    console.error(`❌ RabbitMQ connection error: ${err.message || err}`);
    this.cleanup();
    this.scheduleReconnect();
  }

  private handleConnectionClose(): void {
    if (!this.isConnecting) {
      console.warn('⚠️ RabbitMQ connection closed');
      this.cleanup();
      this.scheduleReconnect();
    }
  }

  private cleanup(): void {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    const delay = Math.min(
      this.INITIAL_RETRY_DELAY * Math.pow(2, this.retryCount),
      this.MAX_RETRY_DELAY,
    );

    console.log(`⏳ Reconnecting to RabbitMQ in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.retryCount++;
      this.connect();
    }, delay);
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (!this.connection)
      throw new Error('RabbitMQ connection not established');
    if (!this.channel)
      this.channel = await (this.connection as any).createConfirmChannel();
    return this.channel!;
  }

  /**
   * Publish with confirmation (Publisher Confirms)
   */
  public async publishToQueue(
    queue: string,
    message: any,
    options?: { priority?: number },
  ): Promise<void> {
    try {
      if (!this.connection) {
        console.warn(`⚠️ Cannot publish to ${queue}: RabbitMQ not connected.`);
        return;
      }

      const ch = await this.getChannel();
      // Ensure queue exists with priority support
      await ch.assertQueue(queue, {
        durable: true,
        deadLetterExchange: this.DLX_NAME,
        deadLetterRoutingKey: `${queue}${this.DLQ_SUFFIX}`,
        arguments: { 'x-max-priority': 10 },
      });

      const content = Buffer.from(JSON.stringify(message));

      return new Promise((resolve, reject) => {
        ch.sendToQueue(
          queue,
          content,
          { persistent: true, priority: options?.priority },
          (err, _ok) => {
            if (err) {
              console.error(`❌ Message NACKed by broker for ${queue}:`, err);
              reject(err);
            } else {
              console.log(
                `📤 Message confirmed to queue '${queue}'${options?.priority ? ` with priority ${options.priority}` : ''}`,
              );
              resolve();
            }
          },
        );
      });
    } catch (error) {
      console.error(`❌ Failed to publish to queue '${queue}':`, error);
    }
  }

  public async consumeFromQueue(
    queue: string,
    onMessage: (data: any) => Promise<void>,
    options?: { prefetch?: number },
  ): Promise<void> {
    this.consumers.set(queue, { handler: onMessage, options });
    if (this.connection) {
      await this.startConsumer(queue, onMessage, options);
    } else {
      console.log(
        `⏳ Consumer for '${queue}' registered, waiting for connection...`,
      );
    }
  }

  private async startConsumer(
    queue: string,
    onMessage: (data: any) => Promise<void>,
    options?: { prefetch?: number },
  ): Promise<void> {
    try {
      const ch = await this.getChannel();
      const dlqName = `${queue}${this.DLQ_SUFFIX}`;

      // 1. Assert Dead Letter Queue (DLQ)
      await ch.assertQueue(dlqName, { durable: true });
      // Bind DLQ to DLX
      await ch.bindQueue(dlqName, this.DLX_NAME, dlqName);

      // 2. Assert Main Queue with DLAT configuration
      await ch.assertQueue(queue, {
        durable: true,
        deadLetterExchange: this.DLX_NAME,
        deadLetterRoutingKey: dlqName, // Send rejected msgs here
        arguments: { 'x-max-priority': 10 }, // Consistently enable priority support
      });

      const prefetch = options?.prefetch ?? 1;
      await ch.prefetch(prefetch);
      console.log(
        `📥 Waiting for messages in '${queue}' (DLQ enabled, prefetch: ${prefetch})...`,
      );

      await ch.consume(
        queue,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            await onMessage(content);
            ch.ack(msg);
          } catch (error) {
            console.error(`❌ Error processing message in '${queue}':`, error);
            // Requeue = false sends it to DLX (Dead Letter Exchange) -> DLQ
            // This prevents infinite loops but saves the message data.
            ch.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    } catch (error) {
      console.error(`❌ Failed to start consumer for '${queue}':`, error);
    }
  }

  private async recoverConsumers(): Promise<void> {
    if (this.consumers.size === 0) return;
    console.log('🔄 Connected. Recovering consumers...');
    for (const [queue, { handler, options }] of this.consumers.entries()) {
      await this.startConsumer(queue, handler, options);
    }
  }
}

export const RabbitMQ = new RabbitMQService();

export const initializeRabbitMQ = async () => {
  if (!config.rabbitmq_enabled) return;

  try {
    await RabbitMQ.connect();
    await setupFeatureUsageLogConsumer();
    await setupCreditsProcessEndConsumer();
    await setupCreditsBatchConsumer(); // Batch processing consumer
  } catch (error) {
    console.warn('⚠️ RabbitMQ setup failed', error);
  }
};
