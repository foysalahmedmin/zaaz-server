import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const priceSchema = z
  .number({ invalid_type_error: 'Price must be a number' })
  .nonnegative('Price must be 0 or greater');

export const createPackagePriceValidationSchema = z.object({
  body: z.object({
    interval: idSchema,
    package: idSchema,
    previous_price: priceSchema.optional(),
    price: priceSchema,
    credits: z
      .number({ invalid_type_error: 'Credits must be a number' })
      .int('Credits must be an integer')
      .nonnegative('Credits must be 0 or greater'),
    is_initial: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const createPackagePricesValidationSchema = z.object({
  body: z.array(createPackagePriceValidationSchema.shape.body),
});

export const updatePackagePriceValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z.object({
    interval: idSchema.optional(),
    package: idSchema.optional(),
    previous_price: priceSchema.optional(),
    price: priceSchema.optional(),
    credits: z
      .number({ invalid_type_error: 'Credits must be a number' })
      .int('Credits must be an integer')
      .nonnegative('Credits must be 0 or greater')
      .optional(),
    is_initial: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const packagePriceOperationValidationSchema = z.object({
  params: z.object({ id: idSchema }),
});
