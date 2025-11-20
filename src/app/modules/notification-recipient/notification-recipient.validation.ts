import { z } from 'zod';

// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const notificationActionSchema = z.object({
  title: z.string().trim().min(1),
  type: z.string().trim().min(1),
  url: z.string().url(),
});

const notificationMetadataSchema = z.object({
  url: z.string().url().optional(),
  image: z.string().url().optional(),
  source: z.string().optional(),
  reference: z.string().optional(),
  actions: z.array(notificationActionSchema),
});

export const createNotificationRecipientValidationSchema = z.object({
  body: z.object({
    notification: idSchema,
    recipient: idSchema,
    metadata: notificationMetadataSchema,
    is_read: z.boolean().default(false),
    read_at: z.coerce.date().nullable().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

export const updateSelfNotificationRecipientValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    is_read: z.boolean().default(false),
    read_at: z.coerce.date().nullable().optional(),
  }),
});

export const updateSelfNotificationRecipientsValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one ID is required',
        invalid_type_error: 'IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one ID is required'),
    is_read: z.boolean().default(false),
    read_at: z.coerce.date().nullable().optional(),
  }),
});

export const updateNotificationRecipientValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    is_read: z.boolean().default(false),
    read_at: z.coerce.date().nullable().optional(),
  }),
});

export const updateNotificationRecipientsValidationSchema = z.object({
  body: z.object({
    ids: z
      .array(idSchema, {
        required_error: 'At least one ID is required',
        invalid_type_error: 'IDs must be an array of valid Mongo IDs',
      })
      .nonempty('At least one ID is required'),
    is_read: z.boolean().default(false),
    read_at: z.coerce.date().nullable().optional(),
  }),
});

export const notificationRecipientOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const notificationRecipientsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one ID is required'),
  }),
});
