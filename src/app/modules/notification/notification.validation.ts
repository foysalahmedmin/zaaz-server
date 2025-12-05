import { z } from 'zod';

export const statusEnum = z.enum(['active', 'inactive', 'archived']);
export const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export const channelEnum = z.enum(['web', 'push', 'email']);
export const typeEnum = z.enum([
  'news-request',
  'news-request-approval',
  'news-headline-request',
  'news-headline-request-approval',
  'news-break-request',
  'news-break-request-approval',
  'reaction',
  'comment',
  'reply',
]);

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createNotificationValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title cannot exceed 100 characters'),
    message: z
      .string()
      .min(1, 'Message is required')
      .max(500, 'Message cannot exceed 500 characters'),
    type: typeEnum,
    priority: priorityEnum.optional(),
    channels: z
      .array(channelEnum)
      .min(1, 'At least one channel is required')
      .max(3, 'No more than 3 channels allowed'),
    sender: idSchema,
    expires_at: z.coerce.date().optional(),
    status: statusEnum.optional(),
  }),
});

export const updateNotificationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title cannot exceed 100 characters')
      .optional(),
    message: z
      .string()
      .min(1, 'Message is required')
      .max(500, 'Message cannot exceed 500 characters')
      .optional(),
    type: typeEnum.optional(),
    priority: priorityEnum.optional(),
    channels: z.array(channelEnum).min(1).max(3).optional(),
    expires_at: z.coerce.date().optional(),
    status: statusEnum.optional(),
  }),
});

export const updateNotificationsValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one notification ID is required'),
    status: statusEnum.optional(),
  }),
});

export const notificationOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const notificationsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one notification ID is required'),
  }),
});
