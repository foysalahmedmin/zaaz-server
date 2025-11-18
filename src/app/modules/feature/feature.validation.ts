import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const featureTypeEnum = z.enum(['writing', 'generation', 'other']);

export const createFeatureValidationSchema = z.object({
  body: z.object({
    parent: idSchema.optional(),
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    path: z
      .string()
      .trim()
      .max(200, 'Path cannot exceed 200 characters')
      .optional(),
    prefix: z.string().trim().optional(),
    type: featureTypeEnum.optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateFeatureValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    parent: idSchema.optional(),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    path: z
      .string()
      .trim()
      .max(200, 'Path cannot exceed 200 characters')
      .optional(),
    prefix: z.string().trim().optional(),
    type: featureTypeEnum.optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateFeaturesValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one feature ID is required',
        invalid_type_error: 'Feature IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one feature ID is required'),
    is_active: z.boolean().optional(),
  }),
});

export const featureOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const featuresOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one feature ID is required'),
  }),
});

