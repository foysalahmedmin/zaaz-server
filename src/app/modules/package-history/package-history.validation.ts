import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const getPackageHistoryValidationSchema = z.object({
  params: z.object({
    packageId: idSchema,
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

export const packageHistoryOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

