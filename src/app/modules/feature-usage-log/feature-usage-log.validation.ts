import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createFeatureUsageLogFromServerValidationSchema = z.object({
  body: z.object({
    feature_endpoint_id: idSchema.optional(),
    feature_endpoint_value: z.string().optional(),
    user_id: idSchema,
    user_email: z.string().email().optional(),
    usage_key: z.string().optional(),
    endpoint: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
    params: z.record(z.unknown()).optional(),
    query: z.record(z.unknown()).optional(),
    payload: z.record(z.unknown()).optional(),
    response: z.record(z.unknown()).optional(),
    code: z.number(),
    status: z.enum(['success', 'failed']),
    type: z.string().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

export const createFeatureUsageLogValidationSchema = z.object({
  body: z.object({
    feature_endpoint: idSchema.optional(),
    user: idSchema,
    email: z.string().email().optional(),
    usage_key: z.string().optional(),
    endpoint: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
    params: z.record(z.unknown()).optional(),
    query: z.record(z.unknown()).optional(),
    payload: z.record(z.unknown()).optional(),
    response: z.record(z.unknown()).optional(),
    code: z.number(),
    status: z.enum(['success', 'failed']),
    type: z.string().optional(),
    is_deleted: z.boolean().optional(),
  }),
});

export const featureUsageLogOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const featureUsageLogsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one log ID is required'),
  }),
});
