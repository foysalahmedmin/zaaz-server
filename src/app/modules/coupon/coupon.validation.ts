import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const priceSchema = z.object({
  USD: z.number().nonnegative().default(0),
  BDT: z.number().nonnegative().default(0),
});

export const createCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase(),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().nonnegative().optional().default(0),
    fixed_amount: priceSchema.optional(),
    min_purchase_amount: priceSchema.optional(),
    max_discount_amount: priceSchema.optional(),
    valid_from: z.coerce.date(),
    valid_until: z.coerce.date(),
    usage_limit: z.number().int().nonnegative(),
    applicable_packages: z.array(idSchema).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase().optional(),
    discount_type: z.enum(['percentage', 'fixed']).optional(),
    discount_value: z.number().nonnegative().optional(),
    fixed_amount: priceSchema.optional(),
    min_purchase_amount: priceSchema.optional(),
    max_discount_amount: priceSchema.optional(),
    valid_from: z.coerce.date().optional(),
    valid_until: z.coerce.date().optional(),
    usage_limit: z.number().int().nonnegative().optional(),
    applicable_packages: z.array(idSchema).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const validateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase(),
    package: idSchema,
    plan: idSchema,
    currency: z.enum(['USD', 'BDT']),
  }),
});
