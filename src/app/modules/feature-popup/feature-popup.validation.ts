import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const featurePopupCategoryEnum = z.enum(['single-time', 'multi-time']);
const featurePopupActionTypeEnum = z.enum(['link', 'other']);
const featurePopupActionVariantEnum = z.enum([
  'default',
  'primary',
  'secondary',
  'outline',
  'destructive',
  'link',
]);
const featurePopupActionSizeEnum = z.enum([
  'full',
  'default',
  'sm',
  'lg',
  'icon',
  'icon-sm',
  'icon-lg',
]);
const featurePopupActionPositionEnum = z.enum(['header', 'footer', 'content']);
const featurePopupSizeEnum = z.enum(['sm', 'md', 'lg', 'xl', 'full']);

const actionSchema = z.object({
  name: z.string().trim().min(2, 'Action name must be at least 2 characters').max(100, 'Action name cannot exceed 100 characters'),
  path: z.string().trim().optional(),
  type: featurePopupActionTypeEnum.default('link'),
  variant: featurePopupActionVariantEnum.optional().default('default'),
  size: featurePopupActionSizeEnum.optional().default('default'),
  position: featurePopupActionPositionEnum.optional().default('content'),
});

// Helper to parse actions from string (FormData) or array
const parseActions = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  },
  z.array(actionSchema).optional().default([]),
);

// Helper to convert string boolean to boolean (for FormData)
const parseBoolean = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return val === 'true' || val === '1';
    }
    return val;
  },
  z.boolean().optional(),
);

// Helper to convert string number to number (for FormData)
const parseNumber = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const parsed = Number(val);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  },
  z.number().optional(),
);

export const createFeaturePopupValidationSchema = z.object({
  body: z.object({
    feature: idSchema,
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    value: z
      .string()
      .trim()
      .min(2, 'Value must be at least 2 characters')
      .max(100, 'Value cannot exceed 100 characters')
      .transform((val) => val.toLowerCase()),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    content: z.string().trim().optional(),
    actions: parseActions,
    category: featurePopupCategoryEnum.optional().default('single-time'),
    priority: parseNumber.default(0),
    size: featurePopupSizeEnum.optional().default('md'),
    delay: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
          }
          return val;
        },
        z.number().int().min(0).optional(),
      )
      .default(0),
    duration: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
          }
          return val;
        },
        z.number().int().min(0).optional(),
      )
      .default(0),
    is_active: parseBoolean.default(true),
  }),
});

export const updateFeaturePopupValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    feature: idSchema.optional(),
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .optional(),
    value: z
      .string()
      .trim()
      .min(2, 'Value must be at least 2 characters')
      .max(100, 'Value cannot exceed 100 characters')
      .transform((val) => val.toLowerCase())
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    content: z.string().trim().optional(),
    actions: parseActions,
    category: featurePopupCategoryEnum.optional(),
    priority: parseNumber,
    size: featurePopupSizeEnum.optional(),
    delay: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
          }
          return val;
        },
        z.number().int().min(0).optional(),
      )
      .optional(),
    duration: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
          }
          return val;
        },
        z.number().int().min(0).optional(),
      )
      .optional(),
    is_active: parseBoolean,
  }),
});

export const featurePopupOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const featurePopupsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one feature popup ID is required'),
  }),
});

