import { RabbitMQ } from '../../rabbitmq';
import * as CreditsProcessServices from './credits-process.service';
import {
  TCreditsProcessEndMultimodelPayload,
  TCreditsProcessEndPayload,
} from './credits-process.type';
import {
  creditsProcessEndMultimodelValidationSchema,
  creditsProcessEndValidationSchema,
} from './credits-process.validation';

const CREDITS_PROCESS_END_QUEUE = 'credits_process_end_queue';
const CREDITS_PROCESS_END_MULTIMODEL_QUEUE =
  'credits_process_end_multimodel_queue';

/**
 * Setup consumer for single-model credit processing
 */
export const setupCreditsProcessEndConsumer = async () => {
  await RabbitMQ.consumeFromQueue(CREDITS_PROCESS_END_QUEUE, async (data) => {
    try {
      const validatedData =
        creditsProcessEndValidationSchema.shape.body.parse(data);
      await CreditsProcessServices.creditsProcessEnd(validatedData as any);
    } catch (error: any) {
      console.error(
        '❌ Error processing credits process end from queue:',
        error,
      );

      if (
        error.name === 'ValidationError' ||
        error.name === 'ZodError' ||
        error.code === 11000
      ) {
        console.warn(
          '⚠️ Validation error or duplicate key, dropping message to avoid infinite loop.',
        );
        return;
      }

      throw error;
    }
  });
};

/**
 * Setup consumer for multi-model credit processing
 */
export const setupCreditsProcessEndMultimodelConsumer = async () => {
  await RabbitMQ.consumeFromQueue(
    CREDITS_PROCESS_END_MULTIMODEL_QUEUE,
    async (data) => {
      try {
        const validatedData =
          creditsProcessEndMultimodelValidationSchema.shape.body.parse(data);
        await CreditsProcessServices.creditsProcessEndMultimodel(
          validatedData as any,
        );
      } catch (error: any) {
        console.error(
          '❌ Error processing credits process end multimodel from queue:',
          error,
        );

        if (
          error.name === 'ValidationError' ||
          error.name === 'ZodError' ||
          error.code === 11000
        ) {
          console.warn(
            '⚠️ Validation error or duplicate key, dropping message to avoid infinite loop.',
          );
          return;
        }

        throw error;
      }
    },
  );
};

/**
 * Publisher for single-model credit processing
 */
export const sendCreditsProcessEnd = async (
  payload: TCreditsProcessEndPayload,
) => {
  await RabbitMQ.publishToQueue(CREDITS_PROCESS_END_QUEUE, payload);
};

/**
 * Publisher for multi-model credit processing
 */
export const sendCreditsProcessEndMultimodel = async (
  payload: TCreditsProcessEndMultimodelPayload,
) => {
  await RabbitMQ.publishToQueue(CREDITS_PROCESS_END_MULTIMODEL_QUEUE, payload);
};
