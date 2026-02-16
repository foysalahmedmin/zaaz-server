import mongoose from 'mongoose';
import { Coupon } from '../coupon/coupon.model';
import { CreditsTransaction } from '../credits-transaction/credits-transaction.model';
import { PackageTransaction } from '../package-transaction/package-transaction.model';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { PaymentTransaction } from './payment-transaction.model';
import { sendPaymentNotificationEmail } from './payment-transaction.utils';
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

    // Check if CreditsTransaction already exists (Idempotency)
    const existingCreditsTransaction = await CreditsTransaction.findOne({
      payment_transaction: transactionId,
      type: 'increase',
      increase_source: 'payment',
    }).session(session);

    if (existingCreditsTransaction) {
      console.log(
        `[PaymentConsumer] Credits already added for transaction: ${transactionId}`,
      );
      if (!externalSession) await session.commitTransaction();
      return;
    }

    // Prepare data
    const packagePlan = transaction.price as any; // Populated
    const plan = transaction.plan as any; // Populated

    if (!packagePlan || !plan) {
      console.error(
        `[PaymentConsumer] Package/Plan data missing for transaction: ${transactionId}`,
      );
      if (!externalSession) await session.abortTransaction();
      return;
    }

    // Update Wallet
    const updateWalletData: any = {
      $inc: { credits: packagePlan.credits },
      package: transaction.package,
      plan: transaction.plan,
      type: 'paid',
    };

    if (plan.duration) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration);
      updateWalletData.expires_at = expiresAt;
    }

    await UserWallet.findByIdAndUpdate(
      transaction.user_wallet,
      updateWalletData,
      {
        session,
        new: true,
      },
    );

    // Create Credits Transaction Log
    await CreditsTransaction.create(
      [
        {
          user: transaction.user,
          user_wallet: transaction.user_wallet,
          email: transaction.email,
          type: 'increase',
          credits: packagePlan.credits,
          increase_source: 'payment',
          payment_transaction: transactionId,
          plan: transaction.plan,
        },
      ],
      { session },
    );

    // Create Package Transaction Log
    await PackageTransaction.create(
      [
        {
          user: transaction.user,
          user_wallet: transaction.user_wallet,
          email: transaction.email,
          package: transaction.package,
          plan: transaction.plan,
          credits: packagePlan.credits,
          increase_source: 'payment',
          payment_transaction: transactionId,
        },
      ],
      { session },
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

    // Non-transactional side effects (Email)
    // We execute this even if external session is passed, assuming successful completion flow
    // But be careful: if external session aborts later, email is sent erroneously?
    // We can't help it easily. Email is side effect.
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
