import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createCreditsProfitValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    percentage: z
      .number({ invalid_type_error: 'Percentage must be a number' })
      .min(0, 'Percentage must be 0 or greater')
      .max(100, 'Percentage cannot exceed 100'),
    is_active: z.boolean().optional(),
  }),
});

export const updateCreditsProfitValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .optional(),
    percentage: z
      .number({ invalid_type_error: 'Percentage must be a number' })
      .min(0, 'Percentage must be 0 or greater')
      .max(100, 'Percentage cannot exceed 100')
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateCreditsProfitsValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one credits profit ID is required',
        invalid_type_error:
          'Credits profit IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one credits profit ID is required'),
    is_active: z.boolean().optional(),
  }),
});

export const creditsProfitOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const creditsProfitsOperationValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema)
      .nonempty('At least one credits profit ID is required'),
  }),
});
