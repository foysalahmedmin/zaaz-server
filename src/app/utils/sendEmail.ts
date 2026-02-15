import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import config from '../config';

export type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: {
    filename: string;
    content?: any;
    path?: string;
    type?: string;
    cid?: string;
    disposition?: string;
  }[];
};

export const sendEmailSMTP = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: EmailOptions) => {
  if (!config.smtp_email || !config.smtp_email_password) {
    throw new Error('SMTP credentials are missing');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp_host || 'smtp.gmail.com',
    port: Number(config.smtp_port) || 587,
    secure: Number(config.smtp_port) === 465,
    auth: {
      user: config.smtp_email,
      pass: config.smtp_email_password,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: config.smtp_email,
      to,
      subject,
      text,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.type,
        cid: att.cid,
      })),
    });
    console.log(`Email sent (SMTP): ${info.messageId}`);
  } catch (error) {
    console.error('SMTP Email Error:', error);
    throw error;
  }
};

export const sendEmailResend = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: EmailOptions) => {
  if (!config.resend_api_key || !config.resend_email) {
    throw new Error('Resend credentials are missing');
  }

  const resend = new Resend(config.resend_api_key);

  try {
    const { data, error } = await resend.emails.send({
      from: config.resend_email,
      to,
      subject,
      text,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.type,
        cid: att.cid,
      })),
    });

    if (error) {
      throw error;
    }

    console.log(`Email sent (Resend): ${data?.id}`);
  } catch (error) {
    console.error('Resend Email Error:', error);
    throw error;
  }
};

export const sendEmailSendgrid = async ({
  to,
  subject,
  text,
  html,
  attachments,
}: EmailOptions) => {
  if (!config.sendgrid_api_key || !config.sendgrid_email) {
    throw new Error('SendGrid credentials are missing');
  }

  sgMail.setApiKey(config.sendgrid_api_key);

  try {
    const info = await sgMail.send({
      from: config.sendgrid_email,
      to,
      subject,
      text,
      html,
      attachments: attachments?.map((att) => {
        // SendGrid requires base64 content
        let content = att.content;
        if (Buffer.isBuffer(content)) {
          content = content.toString('base64');
        }

        return {
          filename: att.filename,
          content: content,
          contentId: att.cid || att.filename,
          disposition: att?.disposition || 'attachment',
          type: att.type,
        };
      }),
    });
    console.log(`Email sent (SendGrid): ${info[0].headers['x-message-id']}`);
  } catch (error: any) {
    console.error('SendGrid Email Error:', error.response?.body || error);
    throw error;
  }
};

export const sendEmail = async (options: EmailOptions) => {
  try {
    if (config.email_provider === 'smtp') {
      await sendEmailSMTP(options);
    } else if (config.email_provider === 'resend') {
      await sendEmailResend(options);
    } else if (config.email_provider === 'sendgrid') {
      await sendEmailSendgrid(options);
    } else {
      // Default to SMTP or log error if provider is unknown
      await sendEmailSMTP(options);
    }
  } catch (error) {
    // Optionally we can log here as well, but the specific functions already do
    throw error;
  }
};
