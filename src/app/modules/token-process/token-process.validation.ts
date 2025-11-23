import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const tokenProcessStartValidationSchema = z.object({
  body: z.object({
    user_id: idSchema,
    feature_endpoint_id: idSchema,
  }),
});

export const tokenProcessEndValidationSchema = z.object({
  body: z.object({
    track_id: z.string().trim().optional(),
    user_id: idSchema,
    feature_endpoint_id: idSchema,
    token_cost: z
      .number({ invalid_type_error: 'Token cost must be a number' })
      .int('Token cost must be an integer')
      .nonnegative('Token cost must be 0 or greater'),
  }),
});

