import { z } from 'zod';

export const createAiModelValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    value: z.string().trim().toLowerCase().min(1, 'Value is required'),
    provider: z.string().trim().min(1, 'Provider is required'),
    input_token_price: z.number().nonnegative('Price must be non-negative'),
    output_token_price: z.number().nonnegative('Price must be non-negative'),
    currency: z.enum(['USD']).default('USD'),
    is_active: z.boolean().optional(),
    is_initial: z.boolean().optional(),
  }),
});

export const updateAiModelValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    value: z.string().trim().toLowerCase().min(1).optional(),
    provider: z.string().trim().min(1).optional(),
    input_token_price: z.number().nonnegative().optional(),
    output_token_price: z.number().nonnegative().optional(),
    currency: z.enum(['USD']).optional(),
    is_active: z.boolean().optional(),
    is_initial: z.boolean().optional(),
  }),
});

export const aiModelsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'At least one ID is required'),
  }),
});
