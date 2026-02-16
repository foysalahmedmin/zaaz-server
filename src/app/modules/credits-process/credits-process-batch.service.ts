import mongoose from 'mongoose';
import config from '../../config';
import { RabbitMQ } from '../../rabbitmq';
import { createCreditsBreaker } from './credits-process.breaker';
import { TCreditsProcessEndMultimodelPayload } from './credits-process.type';
import * as CreditsProcessWorker from './credits-process.worker';

/**
 * Batch Aggregator for Credits Processing
 * Aggregates multiple credit process requests into batches for efficient processing
 * Supports graceful degradation when RabbitMQ is disabled
 */
class CreditsBatchAggregator {
  private batch: Map<string, TCreditsProcessEndMultimodelPayload[]> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;

  private rabbitBreaker;

  constructor() {
    this.rabbitBreaker = createCreditsBreaker(async (payload: any) => {
      await RabbitMQ.publishToQueue('credits_process_batch_queue', payload);
    }, 'rabbitmq_batch_publish');

    this.rabbitBreaker.fallback(async (payload: any) => {
      console.warn(
        '[Batch Aggregator] RabbitMQ Circuit Breaker Open/Fallback - Processing Directly',
      );
      // Convert array of entries back to Map for direct processing
      const batchesMap = new Map(payload.batches) as Map<
        string,
        TCreditsProcessEndMultimodelPayload[]
      >;
      await this.processBatchDirectly(batchesMap);
    });
  }

  private readonly MAX_BATCH_SIZE = 50;
  private readonly MAX_BATCH_WAIT_MS = 100;

  /**
   * Add a payload to the batch queue
   */
  async addToBatch(
    payload: TCreditsProcessEndMultimodelPayload,
  ): Promise<void> {
    const userId = payload.user_id;

    if (!this.batch.has(userId)) {
      this.batch.set(userId, []);
    }

    this.batch.get(userId)!.push(payload);

    // Flush if batch size reached
    if (this.getTotalBatchSize() >= this.MAX_BATCH_SIZE) {
      await this.flush();
    } else if (!this.batchTimer) {
      // Start timer for time-based flush
      this.batchTimer = setTimeout(() => this.flush(), this.MAX_BATCH_WAIT_MS);
    }
  }

  /**
   * Flush current batch to processing queue or direct processing
   */
  private async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const currentBatch = this.batch;
    this.batch = new Map();

    if (currentBatch.size === 0) return;

    // FALLBACK: If RabbitMQ disabled, process synchronously
    if (!config.rabbitmq_enabled) {
      console.log(
        '[Batch Aggregator] RabbitMQ disabled, processing batch synchronously',
      );
      await this.processBatchDirectly(currentBatch);
      return;
    }

    // Publish batch to RabbitMQ via Circuit Breaker
    try {
      await this.rabbitBreaker.fire({
        batches: Array.from(currentBatch.entries()),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(
        '[Batch Aggregator] Circuit Breaker Failed (should have fallen back):',
        error,
      );
      // Final safety net
      await this.processBatchDirectly(currentBatch);
    }
  }

  /**
   * Process batch directly without RabbitMQ (fallback mode)
   */
  private async processBatchDirectly(
    batches: Map<string, TCreditsProcessEndMultimodelPayload[]>,
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Process each user batch sequentially to ensure session safety
      for (const [userId, payloads] of batches.entries()) {
        await this.processBatchForUser(userId, payloads, session);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error('[Batch Aggregator] Direct processing failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process all payloads for a single user
   */
  private async processBatchForUser(
    userId: string,
    payloads: TCreditsProcessEndMultimodelPayload[],
    session: mongoose.ClientSession,
  ): Promise<void> {
    let lastUpdatedCredits = 0;
    let totalCost = 0;
    let successCount = 0;

    // Process each payload using the existing service
    for (const payload of payloads) {
      try {
        // Use worker executeCreditsProcessEnd service with the shared session
        // Pass skipEmit: true to handle notification manually at the end of the user batch
        const response = await CreditsProcessWorker.executeCreditsProcessEnd(
          payload,
          session,
          { skipEmit: true },
        );

        lastUpdatedCredits = response.credits;
        successCount++;

        if (response.details) {
          totalCost += response.details.reduce(
            (sum: number, d: any) => sum + (d.credits || 0),
            0,
          );
        }
      } catch (error) {
        console.error(
          `[Batch Aggregator] Failed to process payload for user ${userId}:`,
          error,
        );
      }
    }

    // Emit a single aggregated update for the user in fallback mode
    if (successCount > 0) {
      try {
        const { emitToUser } = await import('../../socket');
        emitToUser(String(userId), 'wallet:credits-updated', {
          credits: lastUpdatedCredits,
          cost_credits: totalCost,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        console.error(
          '[Batch Aggregator] Aggregated Socket Sync Failed:',
          socketError,
        );
      }
    }
  }

  /**
   * Get total number of items in all batches
   */
  private getTotalBatchSize(): number {
    return Array.from(this.batch.values()).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
  }

  /**
   * Get current batch statistics
   */
  getStats() {
    return {
      totalUsers: this.batch.size,
      totalRequests: this.getTotalBatchSize(),
      hasPendingFlush: this.batchTimer !== null,
    };
  }
}

export const batchAggregator = new CreditsBatchAggregator();
