import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const getTokenProfitHistoryValidationSchema = z.object({
  params: z.object({
    tokenProfitId: idSchema,
  }),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});

export const tokenProfitHistoryOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const tokenProfitHistoriesOperationValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema)
      .nonempty('At least one token profit history ID is required'),
  }),
});
