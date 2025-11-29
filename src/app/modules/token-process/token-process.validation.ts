import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const tokenProcessStartValidationSchema = z.object({
  body: z.object({
    user_id: idSchema,
    feature_endpoint_id: idSchema,
    duration: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be an integer')
      .positive('Duration must be greater than 0')
      .optional(),
  }),
});

export const tokenProcessEndValidationSchema = z.object({
  body: z.object({
    user_id: idSchema,
    feature_endpoint_id: idSchema,
    input_token: z
      .number({ invalid_type_error: 'Input token must be a number' })
      .int('Input token must be an integer')
      .nonnegative('Input token must be 0 or greater'),
    output_token: z
      .number({ invalid_type_error: 'Output token must be a number' })
      .int('Output token must be an integer')
      .nonnegative('Output token must be 0 or greater'),
    model: z.string().optional(),
    duration: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be an integer')
      .positive('Duration must be greater than 0')
      .optional(),
  }),
});
