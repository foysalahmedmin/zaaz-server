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
    email: z.string().email('Invalid email format').optional(),
    package: idSchema.optional(),
    credits: z
      .number({ invalid_type_error: 'Credits must be a number' })
      .int('Credits must be an integer')
      .nonnegative('Credits must be 0 or greater'),
    expires_at: z.string().datetime().optional(),
    type: z.enum(['free', 'paid']).optional(),
  }),
});

export const updateUserWalletValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    credits: z
      .number({ invalid_type_error: 'Credits must be a number' })
      .int('Credits must be an integer')
      .nonnegative('Credits must be 0 or greater')
      .optional(),
    expires_at: z.string().datetime().optional(),
    type: z.enum(['free', 'paid']).optional(),
  }),
});

export const userWalletOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const userWalletsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one user wallet ID is required'),
  }),
});

export const giveInitialCreditsValidationSchema = z.object({
  body: z.object({
    user_id: idSchema,
    email: z.string().email('Invalid email format').optional(),
    credits: z
      .number({
        invalid_type_error: 'Credits must be a number',
      })
      .int('Credits must be an integer')
      .nonnegative('Credits must be 0 or greater')
      .optional(),
    duration: z
      .number({
        invalid_type_error: 'Duration must be a number',
      })
      .int('Duration must be an integer')
      .positive('Duration must be greater than 0')
      .optional(),
  }),
});

export const giveBonusCreditsValidationSchema = z.object({
  body: z.object({
    user_id: idSchema,
    email: z.string().email('Invalid email format').optional(),
    credits: z
      .number({
        invalid_type_error: 'Credits must be a number',
      })
      .int('Credits must be an integer')
      .positive('Credits must be greater than 0'),
  }),
});

export const giveInitialPackageValidationSchema = z.object({
  body: z.object({
    user_id: idSchema,
    email: z.string().email('Invalid email format').optional(),
  }),
});
export const assignPackageValidationSchema = z.object({
  body: z.object({
    user_id: idSchema,
    package_id: idSchema,
    plan_id: idSchema,
    increase_source: z.enum(['payment', 'bonus']),
    email: z.string().email('Invalid email format').optional(),
  }),
});
