import { RabbitMQ } from '../rabbitmq';
import {
  TCreditsProcessEndMultimodelPayload,
  TCreditsProcessEndPayload,
} from './credits-process.type';

const CREDITS_PROCESS_END_QUEUE = 'credits_process_end_queue';
const CREDITS_PROCESS_END_MULTIMODEL_QUEUE =
  'credits_process_end_multimodel_queue';

/**
 * Publish single-model credit process to queue for asynchronous processing
 */
export const sendCreditsProcessEnd = async (
  payload: TCreditsProcessEndPayload,
) => {
  await RabbitMQ.publishToQueue(CREDITS_PROCESS_END_QUEUE, payload);
};

/**
 * Publish multi-model credit process to queue for asynchronous processing
 */
export const sendCreditsProcessEndMultimodel = async (
  payload: TCreditsProcessEndMultimodelPayload,
) => {
  await RabbitMQ.publishToQueue(CREDITS_PROCESS_END_MULTIMODEL_QUEUE, payload);
};
