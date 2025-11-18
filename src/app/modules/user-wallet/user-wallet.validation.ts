import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const getUserWalletValidationSchema = z.object({
  params: z.object({
    userId: idSchema.optional(),
  }),
});

export const createUserWalletValidationSchema = z.object({
  body: z.object({
    user: idSchema,
    package: idSchema,
    token: z
      .number({ invalid_type_error: 'Token must be a number' })
      .int('Token must be an integer')
      .nonnegative('Token must be 0 or greater'),
    expires_at: z.string().datetime().optional(),
  }),
});

export const updateUserWalletValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    token: z
      .number({ invalid_type_error: 'Token must be a number' })
      .int('Token must be an integer')
      .nonnegative('Token must be 0 or greater')
      .optional(),
    expires_at: z.string().datetime().optional(),
  }),
});

export const userWalletOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

