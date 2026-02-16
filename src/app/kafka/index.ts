import {
  Admin,
  Consumer,
  EachMessagePayload,
  Kafka,
  logLevel,
  Producer,
} from 'kafkajs';
import config from '../config';

class KafkaService {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private admin: Admin | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private messageHandlers: Map<string, (data: any) => Promise<void>> =
    new Map();
  private isConnecting: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Backoff configuration
  private retryCount = 0;
  private readonly MAX_RETRY_DELAY = 30000;
  private readonly INITIAL_RETRY_DELAY = 1000;

  // Dead Letter Topic suffix
  private readonly DLT_SUFFIX = '_dlt';

  constructor() {
    this.connect = this.connect.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  public async connect(): Promise<void> {
    if (!config.kafka_enabled) {
      console.log('📨 Kafka is disabled via config.');
      return;
    }

    if (this.kafka || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const brokers = config.kafka_brokers
        ? config.kafka_brokers.split(',').map((broker) => broker.trim())
        : ['localhost:9092'];

      console.log(
        `📨 Attempting to connect to Kafka brokers: ${brokers.join(', ')}...`,
      );

      this.kafka = new Kafka({
        clientId: config.kafka_client_id || 'zaaz-server',
        brokers,
        logLevel:
          config.node_env === 'production' ? logLevel.ERROR : logLevel.INFO,
        retry: {
          initialRetryTime: this.INITIAL_RETRY_DELAY,
          retries: 8,
          maxRetryTime: this.MAX_RETRY_DELAY,
          multiplier: 2,
        },
        connectionTimeout: 10000,
        requestTimeout: 30000,
      });

      // Create producer
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionalId: config.kafka_client_id || 'zaaz-server',
        maxInFlightRequests: 5,
        idempotent: true,
      });

      await this.producer.connect();
      console.log('✅ Kafka Producer connected');

      // Create admin client for topic management
      this.admin = this.kafka.admin();
      await this.admin.connect();
      console.log('✅ Kafka Admin connected');

      this.isConnecting = false;
      this.retryCount = 0;

      await this.setupInfrastructure();
      await this.recoverConsumers();
    } catch (error: any) {
      this.isConnecting = false;
      this.handleError(error);
    }
  }

  /**
   * Setup Dead Letter Topics and other infrastructure
   */
  private async setupInfrastructure(): Promise<void> {
    if (!this.admin) return;

    try {
      // List existing topics
      const existingTopics = await this.admin.listTopics();
      console.log('✅ Kafka Infrastructure verified');
      console.log(`📋 Existing topics: ${existingTopics.join(', ') || 'None'}`);
    } catch (error) {
      console.error('❌ Failed to setup Kafka infrastructure:', error);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      // Disconnect all consumers
      for (const [topic, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        console.log(`🛑 Consumer for topic '${topic}' disconnected`);
      }

      if (this.producer) await this.producer.disconnect();
      if (this.admin) await this.admin.disconnect();

      this.cleanup();
      console.log('🛑 Kafka connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Kafka connection:', error);
    }
  }

  private handleError(err: any): void {
    console.error(`❌ Kafka connection error: ${err.message || err}`);
    this.cleanup();
    this.scheduleReconnect();
  }

  private cleanup(): void {
    this.kafka = null;
    this.producer = null;
    this.admin = null;
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

    console.log(`⏳ Reconnecting to Kafka in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.retryCount++;
      this.connect();
    }, delay);
  }

  /**
   * Publish message to a topic
   */
  public async publishToTopic(
    topic: string,
    message: any,
    key?: string,
  ): Promise<void> {
    try {
      if (!this.producer) {
        console.warn(`⚠️ Cannot publish to ${topic}: Kafka not connected.`);
        return;
      }

      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      console.log(`📤 Message published to topic '${topic}'`);
    } catch (error) {
      console.error(`❌ Failed to publish to topic '${topic}':`, error);
      throw error;
    }
  }

  /**
   * Create Dead Letter Topic if it doesn't exist
   */
  private async ensureDeadLetterTopic(topic: string): Promise<void> {
    if (!this.admin) return;

    const dltTopic = `${topic}${this.DLT_SUFFIX}`;

    try {
      const existingTopics = await this.admin.listTopics();

      if (!existingTopics.includes(dltTopic)) {
        await this.admin.createTopics({
          topics: [
            {
              topic: dltTopic,
              numPartitions: 1,
              replicationFactor: 1,
            },
          ],
        });
        console.log(`✅ Dead Letter Topic '${dltTopic}' created`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to create Dead Letter Topic '${dltTopic}':`,
        error,
      );
    }
  }

  /**
   * Consume messages from a topic
   */
  public async consumeFromTopic(
    topic: string,
    groupId: string,
    onMessage: (data: any) => Promise<void>,
  ): Promise<void> {
    this.messageHandlers.set(topic, onMessage);

    if (this.kafka) {
      await this.startConsumer(topic, groupId, onMessage);
    } else {
      console.log(
        `⏳ Consumer for '${topic}' registered, waiting for connection...`,
      );
    }
  }

  private async startConsumer(
    topic: string,
    groupId: string,
    onMessage: (data: any) => Promise<void>,
  ): Promise<void> {
    if (!this.kafka) {
      console.error('❌ Kafka instance not initialized');
      return;
    }

    try {
      // Ensure Dead Letter Topic exists
      await this.ensureDeadLetterTopic(topic);

      const consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 5000,
        retry: {
          initialRetryTime: this.INITIAL_RETRY_DELAY,
          retries: 8,
          maxRetryTime: this.MAX_RETRY_DELAY,
          multiplier: 2,
        },
      });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      console.log(
        `📥 Waiting for messages in topic '${topic}' (Group: ${groupId})...`,
      );

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;

          try {
            if (!message.value) {
              console.warn(`⚠️ Received empty message in topic '${topic}'`);
              return;
            }

            const content = JSON.parse(message.value.toString());
            await onMessage(content);

            console.log(
              `✅ Message processed from topic '${topic}' (Partition: ${partition}, Offset: ${message.offset})`,
            );
          } catch (error) {
            console.error(
              `❌ Error processing message in topic '${topic}' (Partition: ${partition}, Offset: ${message.offset}):`,
              error,
            );

            // Send to Dead Letter Topic
            await this.sendToDeadLetterTopic(
              topic,
              message.value?.toString() || '',
            );
          }
        },
      });

      this.consumers.set(topic, consumer);
      console.log(`✅ Consumer for topic '${topic}' started successfully`);
    } catch (error) {
      console.error(`❌ Failed to start consumer for topic '${topic}':`, error);
    }
  }

  /**
   * Send failed message to Dead Letter Topic
   */
  private async sendToDeadLetterTopic(
    originalTopic: string,
    messageValue: string,
  ): Promise<void> {
    const dltTopic = `${originalTopic}${this.DLT_SUFFIX}`;

    try {
      if (!this.producer) {
        console.error('❌ Producer not available for DLT');
        return;
      }

      await this.producer.send({
        topic: dltTopic,
        messages: [
          {
            value: messageValue,
            timestamp: Date.now().toString(),
            headers: {
              'original-topic': originalTopic,
              'failed-at': new Date().toISOString(),
            },
          },
        ],
      });

      console.log(`📮 Message sent to Dead Letter Topic '${dltTopic}'`);
    } catch (error) {
      console.error(`❌ Failed to send message to DLT '${dltTopic}':`, error);
    }
  }

  /**
   * Recover all registered consumers after reconnection
   */
  private async recoverConsumers(): Promise<void> {
    if (this.messageHandlers.size === 0) return;

    console.log('🔄 Connected. Recovering consumers...');

    for (const [topic, handler] of this.messageHandlers.entries()) {
      const groupId = `${config.kafka_client_id || 'zaaz-server'}-${topic}-group`;
      await this.startConsumer(topic, groupId, handler);
    }
  }
}

export const KafkaClient = new KafkaService();

export const initializeKafka = async () => {
  if (!config.kafka_enabled) return;

  try {
    await KafkaClient.connect();
  } catch (error) {
    console.warn('⚠️ Kafka setup failed', error);
  }
};
