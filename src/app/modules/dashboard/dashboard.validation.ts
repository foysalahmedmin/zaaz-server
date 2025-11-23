import { z } from 'zod';

export const dashboardPeriodValidationSchema = z.object({
  query: z.object({
    period: z
      .enum(['7d', '30d', '90d', '1y'], {
        errorMap: () => ({ message: 'Period must be one of: 7d, 30d, 90d, 1y' }),
      })
      .optional(),
  }),
});

