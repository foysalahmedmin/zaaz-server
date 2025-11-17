import config from '../../config';
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
