import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import config from '../../config/env';
import { sendEmail } from '../../utils/send-email';
import * as ContactRepository from './contact.repository';
import { TContact, TCreateContact } from './contact.type';

export const createContact = async (
  payload: TCreateContact,
): Promise<TContact> => {
  const created_contact = await ContactRepository.create(payload);

  try {
    await sendEmail({
      to: config.email,
      subject: `Contact Form: ${payload.subject}`,
      text: `You have received a new contact message from ${payload.name} (${payload.email}):\n\n${payload.message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Message</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${payload.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${payload.email}">${payload.email}</a></p>
            <p><strong>Subject:</strong> ${payload.subject}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${payload.message}</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send contact email:', error);
  }

  return created_contact;
};

export const getContacts = async (
  query: Record<string, unknown>,
): Promise<{ data: TContact[]; meta: any }> => {
  return await ContactRepository.findPaginated(query);
};

export const getContact = async (id: string): Promise<TContact> => {
  const result = await ContactRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found');
  }
  return result;
};

export const deleteContact = async (id: string): Promise<void> => {
  const existing = await ContactRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found');
  }
  await ContactRepository.softDeleteById(id);
};

export const deleteContactPermanent = async (id: string): Promise<void> => {
  const existing = await ContactRepository.findByIdWithDeleted(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found');
  }
  await ContactRepository.permanentDeleteById(id);
};

export const deleteContacts = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await ContactRepository.findByIds(ids);
  const foundIds = existing.map((c) => (c as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await ContactRepository.softDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const deleteContactsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await ContactRepository.findByIds(ids);
  const foundIds = existing.map((c) => (c as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await ContactRepository.permanentDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const restoreContact = async (id: string): Promise<TContact> => {
  const result = await ContactRepository.restore(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found or not deleted');
  }
  return result;
};

export const restoreContacts = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await ContactRepository.restoreMany(ids);

  const restored = await ContactRepository.findByIds(ids);
  const restoredIds = restored.map((c) => (c as any)._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  return { count: result.modifiedCount, not_found_ids };
};
