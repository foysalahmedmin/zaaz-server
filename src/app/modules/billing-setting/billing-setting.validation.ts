import { z } from 'zod';

export const createBillingSettingValidationSchema = z.object({
  body: z.object({
    credit_price: z.number().min(0, 'Credit price must be non-negative'),
    currency: z.enum(['USD']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    applied_at: z.string().optional(),
    is_active: z.boolean().optional(),
    is_initial: z.boolean().optional(),
  }),
});

export const updateBillingSettingValidationSchema = z.object({
  body: z.object({
    credit_price: z.number().min(0).optional(),
    currency: z.enum(['USD']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    applied_at: z.string().optional(),
    is_active: z.boolean().optional(),
    is_initial: z.boolean().optional(),
  }),
});

export const billingSettingOperationValidationSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }),
  }),
});

export const billingSettingsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'At least one ID is required'),
  }),
});
