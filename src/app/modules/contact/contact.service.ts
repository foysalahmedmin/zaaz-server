import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../builder/AppError';
import { sendEmail } from '../../utils/sendEmail';
import { Contact } from './contact.model';
import { TContact, TCreateContact } from './contact.type';

export const createContact = async (
  payload: TCreateContact,
): Promise<TContact> => {
  // Save to database
  const created_contact = await Contact.create(payload);

  // Send email notification
  try {
    await sendEmail({
      to: config.auth_user_email,
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
    // Log error but don't fail the request if email fails
    console.error('Failed to send contact email:', error);
  }

  return created_contact.toObject();
};

export const getContacts = async (
  query: Record<string, unknown>,
): Promise<{
  data: TContact[];
  meta: { total: number; page: number; limit: number };
}> => {
  const AppQuery = (await import('../../builder/AppQuery')).default;
  const contactQuery = new AppQuery<TContact>(Contact.find(), query)
    .search(['name', 'email', 'subject', 'message'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await contactQuery.execute();
  return result;
};

export const getContact = async (id: string): Promise<TContact> => {
  const result = await Contact.findById(id).lean();
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found');
  }
  return result;
};

export const deleteContact = async (id: string): Promise<void> => {
  const contact = await Contact.findById(id).lean();
  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found');
  }

  await Contact.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteContactPermanent = async (id: string): Promise<void> => {
  const contact = await Contact.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact not found');
  }

  await Contact.findByIdAndDelete(id);
};

export const deleteContacts = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const contacts = await Contact.find({ _id: { $in: ids } }).lean();
  const foundIds = contacts.map((contact) => contact._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Contact.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteContactsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const contacts = await Contact.find({ _id: { $in: ids } }).lean();
  const foundIds = contacts.map((contact) => contact._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Contact.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreContact = async (id: string): Promise<TContact> => {
  const contact = await Contact.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!contact) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Contact not found or not deleted',
    );
  }

  return contact;
};

export const restoreContacts = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await Contact.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredContacts = await Contact.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredContacts.map((contact) => contact._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};