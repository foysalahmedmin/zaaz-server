import { KafkaClient } from '../../kafka';
import * as CreditsProcessServices from './credits-process.service';
import {
  TCreditsProcessEndMultimodelPayload,
  TCreditsProcessEndPayload,
} from './credits-process.type';
import {
  creditsProcessEndMultimodelValidationSchema,
  creditsProcessEndValidationSchema,
} from './credits-process.validation';

const CREDITS_PROCESS_END_TOPIC = 'credits_process_end_topic';
const CREDITS_PROCESS_END_MULTIMODEL_TOPIC =
  'credits_process_end_multimodel_topic';

const CREDITS_PROCESS_END_GROUP_ID = 'zaaz-server-credits-process-end-group';
const CREDITS_PROCESS_END_MULTIMODEL_GROUP_ID =
  'zaaz-server-credits-process-end-multimodel-group';

/**
 * Setup consumer for single-model credit processing
 */
export const setupCreditsProcessEndConsumer = async () => {
  await KafkaClient.consumeFromTopic(
    CREDITS_PROCESS_END_TOPIC,
    CREDITS_PROCESS_END_GROUP_ID,
    async (data) => {
      try {
        const validatedData =
          creditsProcessEndValidationSchema.shape.body.parse(data);
        await CreditsProcessServices.creditsProcessEnd(validatedData as any);
      } catch (error: any) {
        console.error(
          '❌ Error processing credits process end from Kafka:',
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
 * Setup consumer for multi-model credit processing
 */
export const setupCreditsProcessEndMultimodelConsumer = async () => {
  await KafkaClient.consumeFromTopic(
    CREDITS_PROCESS_END_MULTIMODEL_TOPIC,
    CREDITS_PROCESS_END_MULTIMODEL_GROUP_ID,
    async (data) => {
      try {
        const validatedData =
          creditsProcessEndMultimodelValidationSchema.shape.body.parse(data);
        await CreditsProcessServices.creditsProcessEndMultimodel(
          validatedData as any,
        );
      } catch (error: any) {
        console.error(
          '❌ Error processing credits process end multimodel from Kafka:',
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
  await KafkaClient.publishToTopic(CREDITS_PROCESS_END_TOPIC, payload);
};

/**
 * Publisher for multi-model credit processing
 */
export const sendCreditsProcessEndMultimodel = async (
  payload: TCreditsProcessEndMultimodelPayload,
) => {
  await KafkaClient.publishToTopic(
    CREDITS_PROCESS_END_MULTIMODEL_TOPIC,
    payload,
  );
};
