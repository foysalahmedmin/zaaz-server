import { z } from 'zod';

const id_schema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const status_enum = z.enum(['pending', 'success', 'failed', 'refunded']);
const currency_enum = z.enum(['USD', 'BDT']);

export const initiatePaymentValidationSchema = z.object({
  body: z.object({
    package: id_schema,
    interval: id_schema,
    payment_method: id_schema,
    return_url: z.string().url('Return URL must be a valid URL'),
    cancel_url: z.string().url('Cancel URL must be a valid URL'),
    customer_email: z.string().email('Invalid email format').optional(),
    customer_name: z.string().trim().optional(),
    customer_phone: z.string().trim().optional(),
    currency: currency_enum,
    coupon: z.string().trim().optional(),
  }),
});

export const createPaymentValidationSchema = z.object({
  body: z.object({
    user: id_schema,
    email: z.string().email('Invalid email format').optional(),
    user_wallet: id_schema,
    status: status_enum.optional(),
    payment_method: id_schema,
    gateway_transaction_id: z.string().trim().min(1, 'Gateway transaction ID is required'),
    package: id_schema,
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .nonnegative('Amount must be 0 or greater'),
    currency: currency_enum,
    gateway_fee: z
      .number({ invalid_type_error: 'Gateway fee must be a number' })
      .nonnegative('Gateway fee must be 0 or greater')
      .optional(),
  }),
});

export const updatePaymentValidationSchema = z.object({
  params: z.object({ id: id_schema }),
  body: z.object({
    status: status_enum.optional(),
    gateway_transaction_id: z.string().trim().min(1).optional(),
    gateway_session_id: z.string().trim().optional(),
    gateway_status: z.string().trim().optional(),
    gateway_fee: z
      .number({ invalid_type_error: 'Gateway fee must be a number' })
      .nonnegative()
      .optional(),
    failure_reason: z.string().trim().optional(),
    refund_id: z.string().trim().optional(),
    customer_email: z.string().email('Invalid email format').optional(),
    customer_name: z.string().trim().optional(),
  }),
});

export const paymentOperationValidationSchema = z.object({
  params: z.object({ id: id_schema }),
});

export const webhookValidationSchema = z.object({
  params: z.object({ payment_method_id: id_schema }),
});

export const refundPaymentValidationSchema = z.object({
  params: z.object({ id: id_schema }),
  body: z.object({
    admin_note: z.string().trim().max(500).optional(),
  }),
});
