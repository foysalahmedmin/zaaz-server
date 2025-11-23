import { z } from 'zod';

// ----------------------------------------
// ✅ Create Contact Validation Schema
// ----------------------------------------
// Common schema parts
const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createContactValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .toLowerCase(),
    subject: z
      .string()
      .trim()
      .min(3, 'Subject must be at least 3 characters')
      .max(200, 'Subject cannot exceed 200 characters'),
    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(5000, 'Message cannot exceed 5000 characters'),
  }),
});

export const getContactsValidationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const contactOperationValidationSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const contactsOperationValidationSchema = z.object({
  body: z.object({
    ids: z.array(idSchema).nonempty('At least one contact ID is required'),
  }),
});

