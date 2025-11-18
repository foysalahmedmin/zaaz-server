import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['pending', 'success', 'failed', 'refunded']);

export const createPaymentTransactionValidationSchema = z.object({
  body: z.object({
    user: idSchema,
    user_wallet: idSchema,
    status: statusEnum.optional(),
    payment_method: idSchema,
    gateway_transaction_id: z.string().trim().min(1, 'Gateway transaction ID is required'),
    package: idSchema,
    amount_usd: z
      .number({ invalid_type_error: 'Amount USD must be a number' })
      .nonnegative('Amount USD must be 0 or greater'),
    amount_bdt: z
      .number({ invalid_type_error: 'Amount BDT must be a number' })
      .nonnegative('Amount BDT must be 0 or greater'),
    exchange_rate: z
      .number({ invalid_type_error: 'Exchange rate must be a number' })
      .nonnegative('Exchange rate must be 0 or greater')
      .optional(),
  }),
});

export const updatePaymentTransactionValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    status: statusEnum.optional(),
    gateway_transaction_id: z.string().trim().min(1, 'Gateway transaction ID is required').optional(),
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

