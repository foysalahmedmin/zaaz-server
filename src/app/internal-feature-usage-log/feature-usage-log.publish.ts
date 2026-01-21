import { RabbitMQ } from '../rabbitmq';
import { TFeatureUsageLogFromServer } from './feature-usage-log.type';

const FEATURE_USAGE_QUEUE = 'feature_usage_queue';

/**
 * Publish feature usage log to queue for asynchronous processing
 */
export const sendFeatureUsageLog = async (
  payload: TFeatureUsageLogFromServer,
) => {
  await RabbitMQ.publishToQueue(FEATURE_USAGE_QUEUE, payload);
};
