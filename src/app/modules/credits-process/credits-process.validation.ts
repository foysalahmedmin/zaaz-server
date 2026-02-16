import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const creditsProcessStartValidationSchema = z.object({
  body: z
    .object({
      user_id: idSchema,
      feature_endpoint_id: idSchema.optional(),
      feature_endpoint_value: z.string().optional(),
      duration: z
        .number({ invalid_type_error: 'Duration must be a number' })
        .int('Duration must be an integer')
        .positive('Duration must be greater than 0')
        .optional(),
    })
    .refine((data) => data.feature_endpoint_id || data.feature_endpoint_value, {
      message:
        'Either feature_endpoint_id or feature_endpoint_value must be provided',
    }),
});

export const creditsProcessEndValidationSchema = z.object({
  body: z
    .object({
      user_id: idSchema,
      feature_endpoint_id: idSchema.optional(),
      feature_endpoint_value: z.string().optional(),
      usage_key: z.string().optional(),
      duration: z
        .number({ invalid_type_error: 'Duration must be a number' })
        .int('Duration must be an integer')
        .positive('Duration must be greater than 0')
        .optional(),
      usages: z.array(
        z.object({
          input_tokens: z
            .number({ invalid_type_error: 'Input tokens must be a number' })
            .int('Input tokens must be an integer')
            .nonnegative('Input tokens must be 0 or greater')
            .optional(),
          output_tokens: z
            .number({ invalid_type_error: 'Output tokens must be a number' })
            .int('Output tokens must be an integer')
            .nonnegative('Output tokens must be 0 or greater')
            .optional(),
          ai_model: z.string().optional(),
        }),
      ),
    })
    .refine((data) => data.feature_endpoint_id || data.feature_endpoint_value, {
      message:
        'Either feature_endpoint_id or feature_endpoint_value must be provided',
    }),
});
