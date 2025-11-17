import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['active', 'inactive']);

export const createEventValidationSchema = z.object({
  body: z.object({
    category: idSchema.optional(),
    icon: z.string().optional(),
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 50 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    status: statusEnum.optional(),
    tags: z.array(z.string().min(1)).optional(),
    layout: z.string().optional().default('default').optional(),
    is_featured: z.boolean().optional(),
    published_at: z.coerce.date().optional(),
    expired_at: z.coerce.date().optional(),
  }),
});

export const updateEventValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    category: idSchema.optional(),
    icon: z.string().optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    status: statusEnum.optional(),
    tags: z.array(z.string().min(1)).optional(),
    layout: z.string().optional().default('default').optional(),
    is_featured: z.boolean().optional(),
    published_at: z.coerce.date().optional(),
    expired_at: z.coerce.date().optional(),
  }),
});

export const updateEventsValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one event ID is required',
        invalid_type_error: 'Event IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one event ID is required'),
    status: statusEnum.optional(),
  }),
});

export const eventOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const eventsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one event ID is required'),
  }),
});
