import { z } from 'zod';

export const getBillingSettingHistoryValidationSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }),
  }),
});

export const billingSettingHistoryOperationValidationSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }),
  }),
});

export const billingSettingHistoriesOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'At least one ID is required'),
  }),
});
