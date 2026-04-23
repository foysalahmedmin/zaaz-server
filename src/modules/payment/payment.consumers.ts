import mongoose from 'mongoose';
import { Coupon } from '../coupon/coupon.model';
import { assignPackage } from '../user-wallet/user-wallet.service';
import { PaymentTransaction } from '../payment-transaction/payment-transaction.model';
import { sendPaymentNotificationEmail } from './payment.util';
import { PaymentEventPayload } from './payment.events';

export const handlePaymentCompleted = async (
  payload: PaymentEventPayload,
  external_session?: mongoose.ClientSession,
) => {
  const session = external_session || (await mongoose.startSession());
  if (!external_session) {
    session.startTransaction();
  }

  try {
    const { transaction_id } = payload;

    const transaction = await PaymentTransaction.findById(transaction_id)
      .populate('package interval price coupon')
      .session(session);

    if (!transaction) {
      if (!external_session) await session.abortTransaction();
      return;
    }

    if (transaction.status !== 'success') {
      if (!external_session) await session.abortTransaction();
      return;
    }

    await assignPackage(
      {
        user_id: transaction.user.toString(),
        package_id: transaction.package.toString(),
        interval_id: transaction.interval.toString(),
        increase_source: 'payment',
        payment_transaction_id: transaction_id,
        email: transaction.email,
      },
      session,
    );

    if (transaction.coupon) {
      await Coupon.findByIdAndUpdate(
        transaction.coupon._id,
        { $inc: { usage_count: 1 } },
        { session },
      );
    }

    if (!external_session) {
      await session.commitTransaction();
    }

    const package_plan = transaction.price as any;

    try {
      sendPaymentNotificationEmail('success', transaction.toObject(), package_plan);
    } catch (email_error) {
      console.error('[PaymentConsumer] Failed to send email:', email_error);
    }
  } catch (error) {
    console.error('[PaymentConsumer] Error processing payment completion:', error);
    if (!external_session) await session.abortTransaction();
    throw error;
  } finally {
    if (!external_session) {
      session.endSession();
    }
  }
};
