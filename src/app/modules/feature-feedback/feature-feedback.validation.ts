import { z } from 'zod';

const createFeatureFeedbackValidationSchema = z.object({
  body: z.object({
    feature: z.string({
      required_error: 'Feature ID is required',
    }),
    rating: z
      .number({
        required_error: 'Rating is required',
      })
      .min(1)
      .max(5),
    comment: z.string({
      required_error: 'Comment is required',
    }),
    category: z.enum(['suggestion', 'bug', 'compliment', 'other']).optional(),
  }),
});

const updateFeatureFeedbackValidationSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'reviewed', 'resolved']).optional(),
    admin_note: z.string().optional(),
  }),
});

const bulkOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(z.string()),
  }),
});

const bulkUpdateStatusValidationSchema = z.object({
  body: z.object({
    ids: z.array(z.string()),
    status: z.enum(['pending', 'reviewed', 'resolved']),
  }),
});

export const FeatureFeedbackValidation = {
  createFeatureFeedbackValidationSchema,
  updateFeatureFeedbackValidationSchema,
  bulkOperationValidationSchema,
  bulkUpdateStatusValidationSchema,
};
