import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const priceSchema = z.object({
  USD: z
    .number({ invalid_type_error: 'Price USD must be a number' })
    .nonnegative('Price USD must be 0 or greater'),
  BDT: z
    .number({ invalid_type_error: 'Price BDT must be a number' })
    .nonnegative('Price BDT must be 0 or greater'),
});

export const createPackageValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    content: z.string().trim().optional(),
    token: z
      .number({ invalid_type_error: 'Token must be a number' })
      .int('Token must be an integer')
      .nonnegative('Token must be 0 or greater'),
    features: z
      .array(idSchema, {
        required_error: 'At least one feature is required',
      })
      .nonempty('At least one feature is required'),
    duration: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be an integer')
      .positive('Duration must be at least 1 day')
      .optional(),
    price: priceSchema,
    price_previous: priceSchema.optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updatePackageValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    content: z.string().trim().optional(),
    token: z
      .number({ invalid_type_error: 'Token must be a number' })
      .int('Token must be an integer')
      .nonnegative('Token must be 0 or greater')
      .optional(),
    features: z.array(idSchema).nonempty('At least one feature is required').optional(),
    duration: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be an integer')
      .positive('Duration must be at least 1 day')
      .optional(),
    price: priceSchema.optional(),
    price_previous: priceSchema.optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updatePackagesValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one package ID is required',
        invalid_type_error: 'Package IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one package ID is required'),
    is_active: z.boolean().optional(),
  }),
});

export const packageOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const packagesOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one package ID is required'),
  }),
});

