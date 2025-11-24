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

export const createPackagePlanValidationSchema = z.object({
  body: z.object({
    plan: idSchema,
    package: idSchema,
    previous_price: priceSchema.optional(),
    price: priceSchema,
    token: z
      .number({ invalid_type_error: 'Token must be a number' })
      .int('Token must be an integer')
      .nonnegative('Token must be 0 or greater'),
    is_initial: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const createPackagePlansValidationSchema = z.object({
  body: z.array(createPackagePlanValidationSchema.shape.body),
});

export const updatePackagePlanValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    plan: idSchema.optional(),
    package: idSchema.optional(),
    previous_price: priceSchema.optional(),
    price: priceSchema.optional(),
    token: z
      .number({ invalid_type_error: 'Token must be a number' })
      .int('Token must be an integer')
      .nonnegative('Token must be 0 or greater')
      .optional(),
    is_initial: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const packagePlanOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

