import { RabbitMQ } from '../../rabbitmq';
import * as FeatureUsageLogService from './feature-usage-log.service';
import { TFeatureUsageLogFromServer } from './feature-usage-log.type';
import { createFeatureUsageLogFromServerValidationSchema } from './feature-usage-log.validation';

const FEATURE_USAGE_QUEUE = 'feature_usage_queue';

export const setupFeatureUsageLogConsumer = async () => {
  await RabbitMQ.consumeFromQueue(
    FEATURE_USAGE_QUEUE,
    async (data: TFeatureUsageLogFromServer) => {
      try {
        const validatedData =
          createFeatureUsageLogFromServerValidationSchema.shape.body.parse(
            data,
          );
        await FeatureUsageLogService.createFeatureUsageLogFromServer(
          validatedData as TFeatureUsageLogFromServer,
        );
      } catch (error: any) {
        console.error('❌ Error saving feature usage log from queue:', error);

        if (
          error.name === 'ValidationError' ||
          error.name === 'ZodError' ||
          error.statusCode === 404 ||
          error.status === 404 ||
          error.code === 11000
        ) {
          console.warn(
            '⚠️ Validation error, Not Found, or duplicate key, dropping message to avoid infinite loop.',
          );
          return;
        }

        throw error;
      }
    },
  );
};
