import { z } from 'zod';

const id_schema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const status_enum = z.enum(['pending', 'success', 'failed', 'refunded']);

export const getPaymentTransactionsValidationSchema = z.object({
  query: z.object({
    user: id_schema.optional(),
    email: z.string().optional(),
    user_wallet: id_schema.optional(),
    status: status_enum.optional(),
    payment_method: id_schema.optional(),
    is_test: z.boolean().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const paymentTransactionOperationValidationSchema = z.object({
  params: z.object({ id: id_schema }),
});

export const paymentTransactionsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(id_schema).nonempty('At least one payment transaction ID is required'),
  }),
});
