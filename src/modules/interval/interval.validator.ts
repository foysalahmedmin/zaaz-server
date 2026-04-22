import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createIntervalValidationSchema = z.object({
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
    sequence: z
      .number({ invalid_type_error: 'Sequence must be a number' })
      .int('Sequence must be an integer')
      .nonnegative('Sequence must be 0 or greater')
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateIntervalValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
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
    sequence: z
      .number({ invalid_type_error: 'Sequence must be a number' })
      .int('Sequence must be an integer')
      .nonnegative('Sequence must be 0 or greater')
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateIntervalsValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one interval ID is required',
        invalid_type_error: 'Interval IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one interval ID is required'),
    is_active: z.boolean().optional(),
  }),
});

export const intervalOperationValidationSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const intervalsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one interval ID is required'),
  }),
});
