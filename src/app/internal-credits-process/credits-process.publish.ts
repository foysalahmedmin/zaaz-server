import { RabbitMQ } from '../rabbitmq';
import { TCreditsProcessEndPayload } from './credits-process.type';

const CREDITS_PROCESS_END_QUEUE = 'credits_process_end_queue';

/**
 * Publish credit process to queue for asynchronous processing
 */
export const sendCreditsProcessEnd = async (
  payload: TCreditsProcessEndPayload,
) => {
  await RabbitMQ.publishToQueue(CREDITS_PROCESS_END_QUEUE, payload);
};
