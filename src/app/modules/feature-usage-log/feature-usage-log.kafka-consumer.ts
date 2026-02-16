import { KafkaClient } from '../../kafka';
import * as FeatureUsageLogService from './feature-usage-log.service';
import { TFeatureUsageLogFromServer } from './feature-usage-log.type';
import { createFeatureUsageLogFromServerValidationSchema } from './feature-usage-log.validation';

const FEATURE_USAGE_TOPIC = 'feature_usage_topic';
const FEATURE_USAGE_GROUP_ID = 'zaaz-server-feature-usage-group';

export const setupFeatureUsageLogConsumer = async () => {
  await KafkaClient.consumeFromTopic(
    FEATURE_USAGE_TOPIC,
    FEATURE_USAGE_GROUP_ID,
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
        console.error('❌ Error saving feature usage log from Kafka:', error);

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

/**
 * Publisher for feature usage log
 */
export const sendFeatureUsageLog = async (
  payload: TFeatureUsageLogFromServer,
) => {
  await KafkaClient.publishToTopic(FEATURE_USAGE_TOPIC, payload);
};
