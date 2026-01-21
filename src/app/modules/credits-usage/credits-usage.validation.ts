import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createCreditsUsageValidationSchema = z.object({
  body: z.object({
    user: idSchema,
    email: z.string().email().optional(),
    user_wallet: idSchema,
    usage_key: z.string({ required_error: 'Usage key is required' }).optional(),
    credits_transaction: idSchema,
    credit_price: z.number().optional(),
    ai_model: z.string().optional(),
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    input_credits: z.number().optional(),
    output_credits: z.number().optional(),
    input_token_price: z.number().optional(),
    output_token_price: z.number().optional(),
    profit_credits_percentage: z.number().optional(),
    profit_credits: z.number().optional(),
    cost_credits: z.number().optional(),
    cost_price: z.number().optional(),
    credits: z.number().optional(),
    price: z.number().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateCreditsUsageValidationSchema = z.object({
  body: z.object({
    is_active: z.boolean().optional(),
  }),
});
