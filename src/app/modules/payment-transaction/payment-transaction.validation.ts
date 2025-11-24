import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['pending', 'success', 'failed', 'refunded']);
const currencyEnum = z.enum(['USD', 'BDT']);

export const createPaymentTransactionValidationSchema = z.object({
  body: z.object({
    user: idSchema,
    user_wallet: idSchema,
    status: statusEnum.optional(),
    payment_method: idSchema,
    gateway_transaction_id: z
      .string()
      .trim()
      .min(1, 'Gateway transaction ID is required'),
    package: idSchema,
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .nonnegative('Amount must be 0 or greater'),
    currency: currencyEnum,
    gateway_fee: z
      .number({ invalid_type_error: 'Gateway fee must be a number' })
      .nonnegative('Gateway fee must be 0 or greater')
      .optional(),
  }),
});

export const updatePaymentTransactionValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    status: statusEnum.optional(),
    gateway_transaction_id: z
      .string()
      .trim()
      .min(1, 'Gateway transaction ID is required')
      .optional(),
    gateway_session_id: z.string().trim().optional(),
    gateway_status: z.string().trim().optional(),
    gateway_fee: z
      .number({ invalid_type_error: 'Gateway fee must be a number' })
      .nonnegative('Gateway fee must be 0 or greater')
      .optional(),
    failure_reason: z.string().trim().optional(),
    refund_id: z.string().trim().optional(),
    customer_email: z.string().email('Invalid email format').optional(),
    customer_name: z.string().trim().optional(),
  }),
});

export const getPaymentTransactionsValidationSchema = z.object({
  query: z.object({
    user: idSchema.optional(),
    user_wallet: idSchema.optional(),
    status: statusEnum.optional(),
    payment_method: idSchema.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const paymentTransactionOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const initiatePaymentValidationSchema = z.object({
  body: z.object({
    package: idSchema,
    plan: idSchema,
    payment_method: idSchema,
    return_url: z.string().url('Return URL must be a valid URL'),
    cancel_url: z.string().url('Cancel URL must be a valid URL'),
    customer_email: z.string().email('Invalid email format').optional(),
    customer_name: z.string().trim().optional(),
    customer_phone: z.string().trim().optional(),
  }),
});

export const webhookValidationSchema = z.object({
  params: z.object({
    payment_method_id: idSchema,
  }),
});

export const paymentTransactionsOperationValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema)
      .nonempty('At least one payment transaction ID is required'),
  }),
});
