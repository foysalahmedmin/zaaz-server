import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const typeEnum = z.enum(['increase', 'decrease']);
const increaseSourceEnum = z.enum(['payment', 'bonus']);

export const createTokenTransactionValidationSchema = z
  .object({
    body: z
      .object({
        user: idSchema,
        user_wallet: idSchema,
        type: typeEnum,
        amount: z
          .number({ invalid_type_error: 'Amount must be a number' })
          .int('Amount must be an integer')
          .positive('Amount must be greater than 0'),
        increase_source: increaseSourceEnum.optional(),
        decrease_source: idSchema.optional(),
        payment_transaction: idSchema.optional(),
      })
      .refine(
        (data) => {
          if (data.type === 'increase') {
            return !!data.increase_source;
          }
          return true;
        },
        {
          message: 'increase_source is required when type is increase',
          path: ['increase_source'],
        },
      )
      .refine(
        (data) => {
          if (data.type === 'decrease') {
            return !!data.decrease_source;
          }
          return true;
        },
        {
          message: 'decrease_source is required when type is decrease',
          path: ['decrease_source'],
        },
      )
      .refine(
        (data) => {
          if (data.type === 'increase' && data.increase_source === 'payment') {
            return !!data.payment_transaction;
          }
          return true;
        },
        {
          message:
            'payment_transaction is required when type is increase and increase_source is payment',
          path: ['payment_transaction'],
        },
      ),
  })
  .refine(
    (data) => {
      if (data.body.type === 'increase') {
        return !data.body.decrease_source;
      }
      return true;
    },
    {
      message: 'decrease_source should not be provided when type is increase',
      path: ['body', 'decrease_source'],
    },
  )
  .refine(
    (data) => {
      if (data.body.type === 'decrease') {
        return !data.body.increase_source && !data.body.payment_transaction;
      }
      return true;
    },
    {
      message:
        'increase_source and payment_transaction should not be provided when type is decrease',
      path: ['body'],
    },
  );

export const getTokenTransactionsValidationSchema = z.object({
  query: z.object({
    user: idSchema.optional(),
    user_wallet: idSchema.optional(),
    type: typeEnum.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const tokenTransactionOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const tokenTransactionsOperationValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema)
      .nonempty('At least one token transaction ID is required'),
  }),
});
