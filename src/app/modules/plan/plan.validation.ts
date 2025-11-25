import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createPlanValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    duration: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be an integer')
      .positive('Duration must be at least 1 day'),
    is_active: z.boolean().optional(),
  }),
});

export const updatePlanValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    duration: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be an integer')
      .positive('Duration must be at least 1 day')
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updatePlansValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one plan ID is required',
        invalid_type_error: 'Plan IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one plan ID is required'),
    is_active: z.boolean().optional(),
  }),
});

export const planOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const plansOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one plan ID is required'),
  }),
});

