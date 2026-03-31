import mongoose from 'mongoose';
import { Coupon } from '../coupon/coupon.model';
import { assignPackage } from '../user-wallet/user-wallet.service';
import { PaymentTransaction } from './payment-transaction.model';
import { sendPaymentNotificationEmail } from './payment-transaction.util';
import { PaymentEventPayload } from './payment.events';

/**
 * Consumer for PAYMENT.COMPLETED event.
 * Handles wallet updates, credit transactions, package transactions, and notifications.
 */
export const handlePaymentCompleted = async (
  payload: PaymentEventPayload,
  externalSession?: mongoose.ClientSession,
) => {
  const session = externalSession || (await mongoose.startSession());
  if (!externalSession) {
    session.startTransaction();
  }

  try {
    const { transactionId } = payload;
    console.log(
      `[PaymentConsumer] Processing check-out for transaction: ${transactionId}`,
    );

    // Fetch transaction with necessary population
    const transaction = await PaymentTransaction.findById(transactionId)
      .populate('package plan price coupon')
      .session(session);

    if (!transaction) {
      console.error(
        `[PaymentConsumer] Transaction not found: ${transactionId}`,
      );
      if (!externalSession) await session.abortTransaction();
      // Throwing error will cause NACK/DLQ which is what we want for data issues if we expect it to eventually appear
      // But if it's truly missing forever, maybe we shouldn't retry?
      // For safety, let's treat it as a non-retryable error by logging and returning (acks it).
      return;
    }

    if (transaction.status !== 'success') {
      console.warn(
        `[PaymentConsumer] Transaction status is not success (${transaction.status}), skipping wallet update.`,
      );
      if (!externalSession) await session.abortTransaction();
      return;
    }

    // Use centralized assignPackage logic for wallet update and transaction logging
    await assignPackage(
      {
        user_id: transaction.user.toString(),
        package_id: transaction.package.toString(),
        plan_id: transaction.plan.toString(),
        increase_source: 'payment',
        payment_transaction_id: transactionId,
        email: transaction.email,
      },
      session,
    );

    // Update Coupon Usage
    if (transaction.coupon) {
      await Coupon.findByIdAndUpdate(
        transaction.coupon._id,
        { $inc: { usage_count: 1 } },
        { session },
      );
    }

    if (!externalSession) {
      await session.commitTransaction();
    }
    console.log(
      `[PaymentConsumer] Successfully processed payment completion for ${transactionId}`,
    );

    const packagePlan = transaction.price as any;

    // Non-transactional side effects (Email)
    try {
      sendPaymentNotificationEmail(
        'success',
        transaction.toObject(),
        packagePlan,
      );
    } catch (emailError) {
      console.error('[PaymentConsumer] Failed to send email:', emailError);
    }
  } catch (error) {
    console.error(
      `[PaymentConsumer] Error processing payment completion:`,
      error,
    );
    if (!externalSession) await session.abortTransaction();
    throw error; // Re-throw to trigger NACK/DLQ mechanism
  } finally {
    if (!externalSession) {
      session.endSession();
    }
  }
};


