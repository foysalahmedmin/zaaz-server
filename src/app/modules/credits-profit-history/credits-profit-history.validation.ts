import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const getCreditsProfitHistoryValidationSchema = z.object({
  params: z.object({
    creditsProfitId: idSchema,
  }),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});

export const creditsProfitHistoryOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const creditsProfitHistoriesOperationValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema)
      .nonempty('At least one credits profit history ID is required'),
  }),
});
