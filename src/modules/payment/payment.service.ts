import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import config from '../../config/env';
import { RabbitMQ } from '../../config/rabbitmq';
import { PaymentGatewayFactory } from '../../providers/payment-gateways';
import { getPriceInCurrency } from '../../utils/currency.utils';
import { CouponServices } from '../coupon/coupon.service';
import { Interval } from '../interval/interval.model';
import { PackagePrice } from '../package-price/package-price.model';
import { Package } from '../package/package.model';
import { PaymentMethod } from '../payment-method/payment-method.model';
import * as PaymentTransactionRepository from '../payment-transaction/payment-transaction.repository';
import { TPaymentTransaction } from '../payment-transaction/payment-transaction.type';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { handlePaymentCompleted } from './payment.consumers';
import { PaymentEventPayload } from './payment.events';
import { PaymentStateMachine } from './payment-state-machine';
import { sendPaymentNotificationEmail } from './payment.util';

export const createPaymentTransaction = async (
  data: TPaymentTransaction,
  session?: mongoose.ClientSession,
): Promise<TPaymentTransaction> => {
  const package_data = await Package.findById(data.package)
    .session(session || null)
    .lean();
  if (!package_data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  const wallet = await UserWallet.findById(data.user_wallet)
    .session(session || null)
    .lean();
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  if (!data.email && wallet.email) {
    data.email = wallet.email;
  }

  const result = await PaymentTransactionRepository.create([data], { session });
  return result[0];
};

export const updatePaymentTransactionStatus = async (
  id: string,
  status: TPaymentTransaction['status'],
  session?: mongoose.ClientSession,
  audit_metadata?: any,
  additional_updates?: Partial<TPaymentTransaction>,
): Promise<TPaymentTransaction> => {
  const transaction = await PaymentTransactionRepository.findByIdWithSession(
    id,
    session || null,
  );
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  PaymentStateMachine.validate(transaction.status, status);

  if (
    transaction.status === status &&
    (!additional_updates || Object.keys(additional_updates).length === 0)
  ) {
    return transaction;
  }

  const update_data: any = { status, ...additional_updates };

  if (status === 'success') update_data.paid_at = new Date();
  else if (status === 'failed') update_data.failed_at = new Date();
  else if (status === 'refunded') update_data.refunded_at = new Date();

  const updated_transaction = await PaymentTransactionRepository.updateByIdWithSession(
    id,
    update_data,
    session || null,
  );
  if (!updated_transaction) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update transaction status');
  }

  try {
    PaymentTransactionRepository.createAuditLog([
      {
        transactionId: id,
        previousStatus: transaction.status,
        newStatus: status,
        source: audit_metadata?.source || 'SYSTEM',
        metadata: audit_metadata,
        reason: audit_metadata?.reason,
      },
    ]);
  } catch {
    // non-blocking
  }

  if (status === 'success') {
    const event_payload: PaymentEventPayload = {
      transaction_id: id,
      user_id: updated_transaction.user.toString(),
      amount: updated_transaction.amount,
      currency: updated_transaction.currency,
      payment_method_id: updated_transaction.payment_method.toString(),
      package_id: updated_transaction.package.toString(),
      interval_id: updated_transaction.interval.toString(),
      timestamp: new Date(),
    };

    try {
      await handlePaymentCompleted(event_payload, session);
    } catch (direct_error) {
      console.error('[PaymentService] Direct handlePaymentCompleted failed:', direct_error);
    }

    if (config.rabbitmq_enabled) {
      try {
        await RabbitMQ.publishToQueue('payment.completed', event_payload);
      } catch (mq_error) {
        console.error('[PaymentService] Failed to publish to RabbitMQ:', mq_error);
      }
    }
  } else if (status === 'failed' && updated_transaction.email) {
    try {
      sendPaymentNotificationEmail('failed', updated_transaction as any);
    } catch {
      // non-blocking
    }
  }

  return updated_transaction;
};

export const initiatePayment = async (options: {
  user_id: string;
  package_id: string;
  interval_id: string;
  payment_method_id: string;
  return_url: string;
  cancel_url: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  currency: 'USD' | 'BDT';
  coupon_code?: string;
  session?: mongoose.ClientSession;
}): Promise<{
  payment_transaction: TPaymentTransaction;
  redirect_url?: string;
  payment_url?: string;
}> => {
  const {
    user_id,
    package_id,
    interval_id,
    payment_method_id,
    return_url,
    cancel_url,
    customer_email,
    customer_name,
    customer_phone,
    currency,
    coupon_code,
    session,
  } = options;

  const payment_method = await PaymentMethod.findById(payment_method_id)
    .session(session || null)
    .lean();
  if (!payment_method || !payment_method.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment method not available');
  }
  if (!payment_method.currencies.includes(currency)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment method ${payment_method.name} does not support ${currency}`,
    );
  }

  const package_data = await Package.findById(package_id)
    .session(session || null)
    .lean();
  if (!package_data || !package_data.is_active) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found or inactive');
  }

  const interval = await Interval.findById(interval_id)
    .session(session || null)
    .lean();
  if (!interval || !interval.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Interval not found or not active');
  }

  const package_price = await PackagePrice.findOne({
    package: package_id,
    interval: interval_id,
    is_active: true,
    is_deleted: { $ne: true },
  })
    .session(session || null)
    .lean();
  if (!package_price) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Package-price not found or not active for this package and interval combination',
    );
  }

  let wallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .lean();
  if (!wallet) {
    const new_wallet = await UserWallet.create(
      [{ user: user_id, email: customer_email, credits: 0 }],
      { session },
    );
    wallet = new_wallet[0].toObject() as NonNullable<typeof wallet>;
  }

  const gateway_amount = getPriceInCurrency(package_price.price, currency);

  let discount_amount = 0;
  let coupon_id: mongoose.Types.ObjectId | undefined;
  if (coupon_code) {
    const { coupon, discount_amount: disc } = await CouponServices.validateCoupon(
      coupon_code,
      package_id,
      interval_id,
      currency,
    );
    discount_amount = disc;
    coupon_id =
      typeof coupon._id === 'string'
        ? new mongoose.Types.ObjectId(coupon._id)
        : coupon._id;
  }

  const final_amount = gateway_amount - discount_amount;
  if (final_amount < 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Calculated payment amount cannot be negative');
  }

  const payment_transaction = await PaymentTransactionRepository.create(
    [
      {
        user: new mongoose.Types.ObjectId(user_id),
        email: customer_email,
        user_wallet: wallet._id,
        status: 'pending',
        payment_method: new mongoose.Types.ObjectId(payment_method_id),
        gateway_transaction_id: '',
        package: new mongoose.Types.ObjectId(package_id),
        interval: new mongoose.Types.ObjectId(interval_id),
        price: package_price._id,
        coupon: coupon_id,
        discount_amount,
        amount: final_amount,
        currency,
        return_url,
        cancel_url,
        is_test: payment_method.is_test || false,
      },
    ],
    { session },
  );

  try {
    const webhook_url = `${config.url}/api/payments/webhook/${payment_method_id}`;
    const server_return_url = `${config.url}/api/payments/redirect?transaction_id=${payment_transaction[0]._id}&status=success`;
    const server_cancel_url = `${config.url}/api/payments/redirect?transaction_id=${payment_transaction[0]._id}&status=cancel`;

    const gateway = PaymentGatewayFactory.create(payment_method);
    const payment_response = await gateway.initiatePayment({
      amount: final_amount,
      currency,
      packageId: package_id,
      userId: user_id,
      userWalletId: wallet._id.toString(),
      returnUrl: server_return_url,
      cancelUrl: server_cancel_url,
      ipnUrl: webhook_url,
      customerEmail: customer_email,
      customerName: customer_name,
      customerPhone: customer_phone,
    });

    await PaymentTransactionRepository.updateByIdWithSession(
      payment_transaction[0]._id!,
      {
        gateway_transaction_id: payment_response.gatewayTransactionId,
        gateway_session_id: payment_response.gatewayTransactionId,
        gateway_response: {
          redirect_url: payment_response.redirectUrl,
          payment_url: payment_response.paymentUrl,
          client_secret: payment_response.clientSecret,
        },
      },
      session || null,
    );

    return {
      payment_transaction: payment_transaction[0],
      redirect_url: payment_response.redirectUrl,
      payment_url: payment_response.paymentUrl,
    };
  } catch (error: any) {
    await PaymentTransactionRepository.updateByIdWithSession(
      payment_transaction[0]._id!,
      {
        status: 'failed',
        failure_reason: `Gateway initiation failed: ${error.message}`,
        failed_at: new Date(),
        gateway_response: { error: error.message },
      },
      session || null,
    );
    throw new AppError(httpStatus.BAD_GATEWAY, `Payment gateway error: ${error.message}`);
  }
};

export const verifyPayment = async (
  id: string,
  session?: mongoose.ClientSession,
  user_id?: string,
): Promise<{
  verified: boolean;
  status: string;
  transaction: TPaymentTransaction;
}> => {
  const transaction = await PaymentTransactionRepository.PaymentTransaction.findById(id)
    .session(session || null)
    .populate('payment_method')
    .lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  if (user_id) {
    const tx_user_id = (transaction.user as mongoose.Types.ObjectId).toString();
    if (tx_user_id !== user_id.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You do not have permission to verify this payment transaction',
      );
    }
  }

  const payment_method = transaction.payment_method as any;
  if (!payment_method) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  const gateway_tx_id =
    transaction.gateway_transaction_id || transaction.gateway_session_id;
  if (!gateway_tx_id) {
    return { verified: false, status: 'No gateway transaction ID found', transaction };
  }

  try {
    const gateway = PaymentGatewayFactory.create(payment_method);
    const verification_result = await gateway.verifyPayment(gateway_tx_id);

    if (verification_result.status !== transaction.gateway_status) {
      await PaymentTransactionRepository.updateByIdWithSession(
        id,
        { gateway_status: verification_result.status },
        session || null,
      );
    }

    if (
      verification_result.success &&
      transaction.status !== 'success' &&
      transaction.status !== 'refunded'
    ) {
      await updatePaymentTransactionStatus(id, 'success', session, {
        source: 'MANUAL_VERIFICATION',
        reason: 'Payment verified successfully at gateway',
        metadata: verification_result,
      });
      const updated = await PaymentTransactionRepository.findByIdWithSession(id, session || null);
      return { verified: true, status: 'success', transaction: updated! };
    }

    if (
      !verification_result.success &&
      transaction.status !== 'failed' &&
      transaction.status !== 'refunded'
    ) {
      await updatePaymentTransactionStatus(
        id,
        'failed',
        session,
        {
          source: 'MANUAL_VERIFICATION',
          reason: 'Payment verification failed at gateway',
          metadata: verification_result,
        },
        {
          gateway_status: verification_result.status,
          failure_reason: 'Payment verification failed',
        },
      );
      const updated = await PaymentTransactionRepository.findByIdWithSession(id, session || null);
      return { verified: false, status: 'failed', transaction: updated! };
    }

    return { verified: verification_result.success, status: transaction.status, transaction };
  } catch (error: any) {
    throw new AppError(httpStatus.BAD_GATEWAY, `Payment verification failed: ${error.message}`);
  }
};

export const handlePaymentRedirect = async (params: {
  transaction_id?: string | string[];
  status?: string | string[];
  val_id?: string | string[];
  tran_id?: string | string[];
  error?: string | string[];
  [key: string]: any;
}): Promise<{ redirect_url: string; status_updated: boolean }> => {
  const transaction_id =
    (typeof params.transaction_id === 'string'
      ? params.transaction_id
      : params.transaction_id?.[0]) ||
    (typeof params.tran_id === 'string' ? params.tran_id : params.tran_id?.[0]) ||
    (typeof params.val_id === 'string' ? params.val_id : params.val_id?.[0]);

  if (!transaction_id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Transaction ID is required for redirect');
  }

  const transaction = await PaymentTransactionRepository.PaymentTransaction.findById(
    transaction_id,
  )
    .populate('payment_method')
    .lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  const payment_method = transaction.payment_method as any;
  let redirect_url = transaction.return_url || '/';
  let status_updated = false;

  try {
    const gateway = PaymentGatewayFactory.create(payment_method);
    const result = await gateway.processRedirect(params);

    if (result.status === 'success') {
      await updatePaymentTransactionStatus(transaction_id, 'success', undefined, {
        source: 'REDIRECT',
        reason: 'Gateway redirect verified success',
        metadata: result.gatewayResponse,
      });
      status_updated = true;
    } else if (result.status === 'failed') {
      await updatePaymentTransactionStatus(transaction_id, 'failed', undefined, {
        source: 'REDIRECT',
        reason: result.message || 'Gateway redirect reported failure',
        metadata: result.gatewayResponse,
      });
      redirect_url = transaction.cancel_url || transaction.return_url || '/';
      status_updated = true;
    }
  } catch {
    redirect_url = transaction.cancel_url || transaction.return_url || '/';
  }

  const tx_doc_id = transaction_id;
  const payment_method_id =
    payment_method && typeof payment_method === 'object' && '_id' in payment_method
      ? (payment_method._id as mongoose.Types.ObjectId).toString()
      : undefined;

  const append_params = (url: string): string => {
    try {
      const url_obj = new URL(url);
      if (!url_obj.searchParams.has('transaction_id')) {
        url_obj.searchParams.set('transaction_id', tx_doc_id);
      }
      if (payment_method_id && !url_obj.searchParams.has('payment_method_id')) {
        url_obj.searchParams.set('payment_method_id', payment_method_id);
      }
      return url_obj.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      const parts: string[] = [];
      if (!url.includes('transaction_id=')) parts.push(`transaction_id=${tx_doc_id}`);
      if (payment_method_id && !url.includes('payment_method_id='))
        parts.push(`payment_method_id=${payment_method_id}`);
      return parts.length > 0 ? `${url}${sep}${parts.join('&')}` : url;
    }
  };

  return { redirect_url: append_params(redirect_url), status_updated };
};

export const handlePaymentWebhook = async (
  payment_method_id: string,
  payload: any,
  signature: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const payment_method = await PaymentMethod.findById(payment_method_id)
    .session(session || null)
    .lean();
  if (!payment_method) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  let webhook_result;
  try {
    const gateway = PaymentGatewayFactory.create(payment_method);
    webhook_result = await gateway.handleWebhook(payload, signature);
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook processing failed: ${error.message}`,
    );
  }

  if (!webhook_result.success && !webhook_result.status) return;

  const transaction = await PaymentTransactionRepository.PaymentTransaction.findOne({
    $or: [
      { gateway_transaction_id: webhook_result.transactionId },
      { gateway_session_id: webhook_result.transactionId },
    ],
  })
    .session(session || null)
    .lean();

  if (!transaction) return;

  const additional_updates: any = {};
  if (payload.customer_email || payload.cus_email) {
    additional_updates.customer_email = (payload.customer_email || payload.cus_email)
      .toLowerCase()
      .trim();
  }
  if (payload.customer_details?.name || payload.cus_name || payload.customer_name) {
    additional_updates.customer_name = (
      payload.customer_details?.name ||
      payload.cus_name ||
      payload.customer_name
    ).trim();
  }

  if (webhook_result.status === 'success') {
    await updatePaymentTransactionStatus(
      (transaction._id as mongoose.Types.ObjectId).toString(),
      'success',
      session,
      {
        source: 'WEBHOOK',
        reason: 'Webhook confirmed success',
        metadata: { gateway_response: payload, webhook_result },
      },
      additional_updates,
    );
  } else if (webhook_result.status === 'failed') {
    await updatePaymentTransactionStatus(
      (transaction._id as mongoose.Types.ObjectId).toString(),
      'failed',
      session,
      {
        source: 'WEBHOOK',
        reason: 'Webhook confirmed failure',
        metadata: { gateway_response: payload, webhook_result },
      },
      additional_updates,
    );
  }
};
