import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['active', 'inactive', 'archived']);

export const createFileValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').optional(),
    category: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    caption: z
      .string()
      .trim()
      .max(500, 'Caption cannot exceed 500 characters')
      .optional(),
    status: statusEnum.optional(),
  }),
});

export const updateFileValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Name must be at least 1 character')
      .optional(),
    category: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    caption: z
      .string()
      .trim()
      .max(500, 'Caption cannot exceed 500 characters')
      .optional(),
    status: statusEnum.optional(),
  }),
});

export const updateFilesValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one file ID is required',
        invalid_type_error: 'File IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one file ID is required'),
    status: statusEnum.optional(),
  }),
});

export const fileOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const filesOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one file ID is required'),
  }),
});
