import { z } from 'zod';

export const getAiModelHistoryValidationSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }),
  }),
});

export const aiModelHistoryOperationValidationSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }),
  }),
});

export const aiModelHistoriesOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'At least one ID is required'),
  }),
});
