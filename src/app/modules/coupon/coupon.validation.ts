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
    code: z.string().trim(),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.number().nonnegative().optional().default(0),
    ),
    fixed_amount: z.preprocess(
      (val) => (val === null ? undefined : val),
      priceSchema.optional(),
    ),
    min_purchase_amount: z.preprocess(
      (val) => (val === null ? undefined : val),
      priceSchema.optional(),
    ),
    max_discount_amount: z.preprocess(
      (val) => (val === null ? undefined : val),
      priceSchema.optional(),
    ),
    valid_from: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.coerce.date().optional(),
    ),
    valid_until: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.coerce.date().optional(),
    ),
    usage_limit: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.number().int().nonnegative().optional(),
    ),
    applicable_packages: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.array(idSchema).optional(),
    ),
    is_active: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.boolean().optional(),
    ),
    is_affiliate: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.boolean().optional(),
    ),
  }),
});

export const updateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().trim().optional(),
    discount_type: z.enum(['percentage', 'fixed']).optional(),
    discount_value: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.number().nonnegative().optional(),
    ),
    fixed_amount: z.preprocess(
      (val) => (val === null ? undefined : val),
      priceSchema.optional(),
    ),
    min_purchase_amount: z.preprocess(
      (val) => (val === null ? undefined : val),
      priceSchema.optional(),
    ),
    max_discount_amount: z.preprocess(
      (val) => (val === null ? undefined : val),
      priceSchema.optional(),
    ),
    valid_from: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.coerce.date().optional(),
    ),
    valid_until: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.coerce.date().optional(),
    ),
    usage_limit: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.number().int().nonnegative().optional(),
    ),
    applicable_packages: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.array(idSchema).optional(),
    ),
    is_active: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.boolean().optional(),
    ),
    is_affiliate: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.boolean().optional(),
    ),
  }),
});

export const validateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().trim(),
    package: idSchema,
    plan: idSchema,
    currency: z.enum(['USD', 'BDT']),
  }),
});
