import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.auth_user_email,
      pass: config.auth_user_email_password,
    },
  });

  await transporter.sendMail({
    from: config.auth_user_email,
    to,
    subject,
    text,
    html,
  });
};
