import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const methodEnum = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const createFeatureEndpointValidationSchema = z.object({
  body: z.object({
    feature: idSchema,
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    value: z
      .string()
      .trim()
      .min(2, 'Value must be at least 2 characters')
      .max(100, 'Value cannot exceed 100 characters')
      .transform((val) => val.toLowerCase()),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    endpoint: z.string().trim().min(1, 'Endpoint is required'),
    method: methodEnum,
    min_credits: z
      .number({ invalid_type_error: 'Credits must be a number' })
      .int('Credits must be an integer')
      .nonnegative('Credits must be 0 or greater'),
    sequence: z
      .number({ invalid_type_error: 'Sequence must be a number' })
      .int('Sequence must be an integer')
      .nonnegative('Sequence must be 0 or greater')
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateFeatureEndpointValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    feature: idSchema.optional(),
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .optional(),
    value: z
      .string()
      .trim()
      .min(2, 'Value must be at least 2 characters')
      .max(100, 'Value cannot exceed 100 characters')
      .transform((val) => val.toLowerCase())
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    min_credits: z.string().trim().min(1, 'Endpoint is required').optional(),
    method: methodEnum.optional(),
    credits: z
      .number({ invalid_type_error: 'Credits must be a number' })
      .int('Credits must be an integer')
      .nonnegative('Credits must be 0 or greater')
      .optional(),
    sequence: z
      .number({ invalid_type_error: 'Sequence must be a number' })
      .int('Sequence must be an integer')
      .nonnegative('Sequence must be 0 or greater')
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateFeatureEndpointsValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one feature endpoint ID is required',
        invalid_type_error:
          'Feature endpoint IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one feature endpoint ID is required'),
    is_active: z.boolean().optional(),
  }),
});

export const featureEndpointOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const featureEndpointsOperationValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema)
      .nonempty('At least one feature endpoint ID is required'),
  }),
});
