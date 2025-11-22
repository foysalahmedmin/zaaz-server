import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createPaymentMethodValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    value: z
      .string()
      .trim()
      .min(2, 'Value must be at least 2 characters')
      .toLowerCase(),
    currency: z
      .string()
      .trim()
      .length(3, 'Currency must be a 3-letter ISO code')
      .toUpperCase(),
    secret: z.string().trim().min(1, 'Secret is required'),
    public_key: z.string().trim().optional(),
    webhook_key: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    webhook_url: z.string().url('Webhook URL must be a valid URL').optional(),
    currencies: z.array(z.string().length(3)).optional(),
    config: z.record(z.any()).optional(),
    is_test: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updatePaymentMethodValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .optional(),
    value: z
      .string()
      .trim()
      .min(2, 'Value must be at least 2 characters')
      .toLowerCase()
      .optional(),
    currency: z
      .string()
      .trim()
      .length(3, 'Currency must be a 3-letter ISO code')
      .toUpperCase()
      .optional(),
    secret: z.string().trim().min(1, 'Secret is required').optional(),
    public_key: z.string().trim().optional(),
    webhook_key: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    webhook_url: z.string().url('Webhook URL must be a valid URL').optional(),
    currencies: z.array(z.string().length(3)).optional(),
    config: z.record(z.any()).optional(),
    is_test: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updatePaymentMethodsValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one payment method ID is required',
        invalid_type_error:
          'Payment method IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one payment method ID is required'),
    is_active: z.boolean().optional(),
  }),
});

export const paymentMethodOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const paymentMethodsOperationValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema)
      .nonempty('At least one payment method ID is required'),
  }),
});
