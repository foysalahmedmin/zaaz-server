import mongoose from 'mongoose';
import path from 'path';
import config from '../../config/env';
import {
  getTransactionFailedTemplate,
  getTransactionSuccessTemplate,
} from '../../templates/payment-transaction.temlate';
import { sendEmail } from '../../utils/send-email';
import { TPaymentTransaction } from '../payment-transaction/payment-transaction.type';

export const sendPaymentNotificationEmail = async (
  type: 'success' | 'failed',
  transaction: TPaymentTransaction & { _id: mongoose.Types.ObjectId },
  package_plan?: any,
) => {
  const recipient_email = transaction.email;
  if (!recipient_email) return;

  const email_data = {
    recipient_email,
    customer_name: transaction.customer_name || recipient_email.split('@')[0],
    transaction_id:
      transaction.gateway_transaction_id || transaction._id.toString(),
    amount: transaction.amount,
    currency: transaction.currency,
    failure_reason: transaction.failure_reason,
    package_name:
      (transaction as any).package?.name ||
      package_plan?.package?.name ||
      'Package',
    plan_name:
      (transaction as any).interval?.name || package_plan?.interval?.name || 'Interval',
    credits: package_plan?.credits || (transaction as any).price?.credits || 0,
  };

  const logo_light_path = path.join(process.cwd(), 'assets', 'zaaz-logo-light.png');
  const logo_dark_path = path.join(process.cwd(), 'assets', 'zaaz-logo-dark.png');

  (async () => {
    try {
      let email_html = '';
      let subject = '';
      let text = '';

      if (type === 'success') {
        subject = 'Payment Successful - zaaz';
        text = `Your payment of ${email_data.amount} ${email_data.currency} was successful.`;
        email_html = getTransactionSuccessTemplate({
          customerName: email_data.customer_name,
          transactionId: email_data.transaction_id,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          amount: email_data.amount,
          currency: email_data.currency,
          packageName: email_data.package_name,
          planName: email_data.plan_name,
          credits: email_data.credits,
          supportEmail: config.smtp_email || 'support@zaaz.com',
        });
      } else {
        subject = 'Payment Attempt Unsuccessful - ZaaZ';
        text = `Your payment of ${email_data.amount} ${email_data.currency} was unsuccessful.`;
        email_html = getTransactionFailedTemplate({
          customerName: email_data.customer_name,
          transactionId: email_data.transaction_id,
          amount: email_data.amount,
          currency: email_data.currency,
          failureReason: email_data.failure_reason,
          supportEmail: config.smtp_email || 'support@zaaz.com',
        });
      }

      await sendEmail({
        to: email_data.recipient_email,
        subject,
        text,
        html: email_html,
        attachments: [
          {
            filename: 'zaaz-logo-light.png',
            path: logo_light_path,
            cid: 'zaaz-logo-light',
            disposition: 'inline',
          },
          {
            filename: 'zaaz-logo-dark.png',
            path: logo_dark_path,
            cid: 'zaaz-logo-dark',
            disposition: 'inline',
          },
        ],
      });
    } catch (email_error) {
      console.error(`[Payment Email] Background error during ${type}:`, {
        transaction_id: transaction._id.toString(),
        error: email_error instanceof Error ? email_error.message : String(email_error),
      });
    }
  })();
};
