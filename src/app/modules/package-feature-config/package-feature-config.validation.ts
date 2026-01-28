import { z } from 'zod';

// Helper schemas
const idSchema = z.string().trim().min(1, 'ID is required');

const configSchema = z.object({
  min_credits: z.number().min(0).optional(),
  max_credits: z.number().min(0).optional(),
  daily_limit: z.number().min(1).optional(),
  monthly_limit: z.number().min(1).optional(),
  enabled_options: z.array(z.string()).optional(),
  disabled_options: z.array(z.string()).optional(),
  max_tokens: z.number().min(1).optional(),
  quality_tier: z.enum(['basic', 'standard', 'premium']).optional(),
  priority: z.number().min(0).max(100).optional(),
  custom: z.record(z.any()).optional(),
});

export const createPackageFeatureConfigValidationSchema = z.object({
  body: z
    .object({
      package: idSchema,
      feature: idSchema.optional(),
      feature_endpoint: idSchema.optional(),
      config: configSchema,
      description: z.string().trim().optional(),
      sequence: z.number().min(0).optional(),
      is_active: z.boolean().default(true),
    })
    .refine((data) => data.feature || data.feature_endpoint, {
      message: 'At least one of feature or feature_endpoint must be provided',
    })
    .refine(
      (data) => {
        if (data.feature_endpoint && !data.feature) {
          return false;
        }
        return true;
      },
      {
        message: 'Feature is required when feature_endpoint is provided',
      },
    )
    .refine(
      (data) => {
        if (
          data.config.min_credits !== undefined &&
          data.config.max_credits !== undefined
        ) {
          return data.config.max_credits >= data.config.min_credits;
        }
        return true;
      },
      {
        message: 'max_credits must be greater than or equal to min_credits',
      },
    ),
});

export const updatePackageFeatureConfigValidationSchema = z.object({
  body: z
    .object({
      package: idSchema.optional(),
      feature: idSchema.optional(),
      feature_endpoint: idSchema.optional(),
      config: configSchema.optional(),
      description: z.string().trim().optional(),
      sequence: z.number().min(0).optional(),
      is_active: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (
          data.config &&
          data.config.min_credits !== undefined &&
          data.config.max_credits !== undefined
        ) {
          return data.config.max_credits >= data.config.min_credits;
        }
        return true;
      },
      {
        message: 'max_credits must be greater than or equal to min_credits',
      },
    ),
});

export const bulkUpsertConfigsValidationSchema = z.object({
  body: z.object({
    configs: z.array(
      z.object({
        feature: idSchema.optional(),
        feature_endpoint: idSchema.optional(),
        config: configSchema,
        description: z.string().trim().optional(),
        sequence: z.number().min(0).optional(),
      }),
    ),
  }),
});
