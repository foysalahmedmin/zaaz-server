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

  await transporter.sendMail({
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
    })),
  });
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

  await resend.emails.send({
    from: config.resend_email || 'onboarding@resend.dev',
    to,
    subject,
    text,
    html,
    attachments: attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      path: att.path,
    })),
  });
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

  await sgMail.send({
    from: config.sendgrid_email,
    to,
    subject,
    text,
    html,
    attachments: attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentId: att.filename,
      disposition: att?.disposition || 'attachment',
      type: att.type,
    })),
  });
};

export const sendEmail = async (options: EmailOptions) => {
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
};
