import mongoose from 'mongoose';
import path from 'path';
import config from '../../config';
import {
  getTransactionFailedTemplate,
  getTransactionSuccessTemplate,
} from '../../templates/payment-transaction.temlate';
import { sendEmail } from '../../utils/sendEmail';
import { TPaymentTransaction } from './payment-transaction.type';

export const sendPaymentNotificationEmail = async (
  type: 'success' | 'failed',
  transaction: TPaymentTransaction & { _id: mongoose.Types.ObjectId },
  packagePlan?: any,
) => {
  const recipientEmail = transaction.email;
  if (!recipientEmail) return;

  // Snapshot data for the email
  const emailData = {
    recipientEmail,
    customerName: transaction.customer_name || recipientEmail.split('@')[0],
    transactionId:
      transaction.gateway_transaction_id || transaction._id.toString(),
    amount: transaction.amount,
    currency: transaction.currency,
    failureReason: transaction.failure_reason,
    packageName: packagePlan?.package?.name || 'Package',
    planName: packagePlan?.plan?.name || 'Plan',
    credits: packagePlan?.credits || 0,
  };

  // Define logo paths (from root assets folder)
  const logoLightPath = path.join(
    process.cwd(),
    'assets',
    'zaaz-logo-light.png',
  );
  const logoDarkPath = path.join(process.cwd(), 'assets', 'zaaz-logo-dark.png');

  // Create a separate async block to handle the email sending
  // This ensures the main process continues without waiting for the email service
  (async () => {
    try {
      let emailHtml = '';
      let subject = '';
      let text = '';

      if (type === 'success') {
        subject = 'Payment Successful - zaaz';
        text = `Your payment of ${emailData.amount} ${emailData.currency} was successful.`;
        emailHtml = getTransactionSuccessTemplate({
          customerName: emailData.customerName,
          transactionId: emailData.transactionId,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          amount: emailData.amount,
          currency: emailData.currency,
          packageName: emailData.packageName,
          planName: emailData.planName,
          credits: emailData.credits,
          supportEmail: config.smtp_email || 'support@zaaz.com',
        });
      } else {
        subject = 'Payment Attempt Unsuccessful - ZaaZ';
        text = `Your payment of ${emailData.amount} ${emailData.currency} was unsuccessful.`;
        emailHtml = getTransactionFailedTemplate({
          customerName: emailData.customerName,
          transactionId: emailData.transactionId,
          amount: emailData.amount,
          currency: emailData.currency,
          failureReason: emailData.failureReason,
          supportEmail: config.smtp_email || 'support@zaaz.com',
        });
      }

      await sendEmail({
        to: emailData.recipientEmail,
        subject,
        text,
        html: emailHtml,
        attachments: [
          {
            filename: 'zaaz-logo-light.png',
            path: logoLightPath,
            cid: 'zaaz-logo-light',
            disposition: 'inline',
          },
          {
            filename: 'zaaz-logo-dark.png',
            path: logoDarkPath,
            cid: 'zaaz-logo-dark',
            disposition: 'inline',
          },
        ],
      });

      console.log(
        `[Payment Email] ${type.toUpperCase()} email sent to:`,
        emailData.recipientEmail,
      );
    } catch (emailError) {
      console.error(`[Payment Email] Background error during ${type}:`, {
        transactionId: transaction._id.toString(),
        error:
          emailError instanceof Error ? emailError.message : String(emailError),
      });
    }
  })();
};
