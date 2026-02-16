import mongoose from 'mongoose';
import { RabbitMQ } from '../../rabbitmq';
import { emitToUser } from '../../socket';
import { TCreditsProcessEndMultimodelPayload } from './credits-process.type';
import { creditsProcessEndValidationSchema } from './credits-process.validation';
import * as CreditsProcessWorker from './credits-process.worker';

const CREDITS_PROCESS_BATCH_QUEUE = 'credits_process_batch_queue';

/**
 * Setup consumer for batch credit processing
 * Processes batches of credit deduction requests efficiently
 */
export const setupCreditsBatchConsumer = async () => {
  await RabbitMQ.consumeFromQueue(
    CREDITS_PROCESS_BATCH_QUEUE,
    async (data: {
      batches: [string, TCreditsProcessEndMultimodelPayload[]][];
      timestamp: number;
    }) => {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Process each user batch sequentially to ensure session safety
          for (const [userId, payloads] of data.batches) {
            await processBatchForUser(userId, payloads, session);
          }

          await session.commitTransaction();
          console.log(
            `[Batch Consumer] Successfully processed ${data.batches.length} user batches`,
          );
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }
      } catch (error: any) {
        console.error(
          '[Batch Consumer] Error processing batch from queue:',
          error,
        );

        // Don't throw for validation errors to avoid infinite retry
        if (
          error.name === 'ValidationError' ||
          error.name === 'ZodError' ||
          error.code === 11000
        ) {
          console.warn(
            '⚠️ Validation error or duplicate key, dropping batch to avoid infinite loop.',
          );
          return;
        }

        throw error;
      }
    },
    { prefetch: 5 },
  );
};

/**
 * Process all payloads for a single user
 */
async function processBatchForUser(
  userId: string,
  payloads: TCreditsProcessEndMultimodelPayload[],
  session: mongoose.ClientSession,
): Promise<void> {
  let lastUpdatedCredits = 0;
  let totalCost = 0;
  let successCount = 0;

  for (const payload of payloads) {
    try {
      // Validate payload
      const validatedData =
        creditsProcessEndValidationSchema.shape.body.parse(payload);

      // Process using worker service with skipEmit to avoid noise
      const response = await CreditsProcessWorker.executeCreditsProcessEnd(
        validatedData as any,
        session,
        { skipEmit: true },
      );

      lastUpdatedCredits = response.credits;
      successCount++;

      // Sum up costs for the single aggregated notification
      if (response.details) {
        totalCost += response.details.reduce(
          (sum: number, d: any) => sum + (d.credits || 0),
          0,
        );
      }
    } catch (error) {
      console.error(
        `[Batch Consumer] Failed to process individual payload for user ${userId}:`,
        error,
      );
      // Continue processing other payloads in the batch
    }
  }

  // Emit a single aggregated update for the user only if at least one deduction succeeded
  if (successCount > 0) {
    try {
      emitToUser(String(userId), 'wallet:credits-updated', {
        credits: lastUpdatedCredits,
        cost_credits: totalCost,
        timestamp: new Date().toISOString(),
      });
      console.log(
        `[Batch Consumer] Notified user ${userId} of updated balance: ${lastUpdatedCredits} (-${totalCost} credits across ${successCount} ops)`,
      );
    } catch (socketError) {
      console.error(
        '[Batch Consumer] Aggregated Socket Sync Failed:',
        socketError,
      );
    }
  }
}
