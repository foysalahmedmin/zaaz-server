import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { PaymentGatewayFactory } from '../../payment-gateways';
import { Package } from '../package/package.model';
import { PaymentMethod } from '../payment-method/payment-method.model';
import { TokenTransaction } from '../token-transaction/token-transaction.model';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { PaymentTransaction } from './payment-transaction.model';
import { TPaymentTransaction } from './payment-transaction.type';

export const createPaymentTransaction = async (
  data: TPaymentTransaction,
  session?: mongoose.ClientSession,
): Promise<TPaymentTransaction> => {
  // Validate package exists
  const packageData = await Package.findById(data.package)
    .session(session || null)
    .lean();

  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // Validate user_wallet exists
  const wallet = await UserWallet.findById(data.user_wallet)
    .session(session || null)
    .lean();

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  const result = await PaymentTransaction.create([data], { session });
  return result[0].toObject();
};

export const updatePaymentTransactionStatus = async (
  id: string,
  status: TPaymentTransaction['status'],
  session?: mongoose.ClientSession,
): Promise<TPaymentTransaction> => {
  const transaction = await PaymentTransaction.findById(id)
    .session(session || null)
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  // If status is changing to success, create token transaction and update wallet
  if (status === 'success' && transaction.status !== 'success') {
    const packageData = await Package.findById(transaction.package)
      .session(session || null)
      .lean();

    if (!packageData) {
      throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
    }

    // Prepare wallet update data
    const updateWalletData: any = {
      $inc: { token: packageData.token },
      package: transaction.package, // Update to newly purchased package
    };

    // Calculate and set expires_at if package has duration
    if (packageData.duration) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + packageData.duration);
      updateWalletData.expires_at = expiresAt;
    }

    // Update wallet with package tokens, package reference, and expiration
    await UserWallet.findByIdAndUpdate(
      transaction.user_wallet,
      updateWalletData,
      { session },
    );

    // Create token transaction record
    await TokenTransaction.create(
      [
        {
          user: transaction.user,
          user_wallet: transaction.user_wallet,
          type: 'increase',
          amount: packageData.token,
          increase_source: 'payment',
          payment_transaction: id,
        },
      ],
      { session },
    );
  }

  // Update transaction with status and timestamps
  const updateData: any = { status };

  if (status === 'success' && transaction.status !== 'success') {
    updateData.paid_at = new Date();
  }

  if (status === 'refunded') {
    updateData.refunded_at = new Date();
  }

  if (status === 'failed' && transaction.status !== 'failed') {
    updateData.failed_at = new Date();
  }

  const result = await PaymentTransaction.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).session(session || null);

  return result!;
};

export const getPaymentTransactions = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPaymentTransaction[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { user, user_wallet, status, payment_method, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (user) {
    filter.user = user;
  }

  if (user_wallet) {
    filter.user_wallet = user_wallet;
  }

  if (status) {
    filter.status = status;
  }

  if (payment_method) {
    filter.payment_method = payment_method;
  }

  const paymentTransactionQuery = new AppQuery<TPaymentTransaction>(
    PaymentTransaction.find().populate([
      { path: 'user_wallet', select: '_id token' },
      { path: 'payment_method', select: '_id name currency' },
      { path: 'package', select: '_id name token price' },
    ]),
    { ...rest, ...filter },
  )
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await paymentTransactionQuery.execute();

  return result;
};

export const getPaymentTransaction = async (
  id: string,
): Promise<TPaymentTransaction> => {
  const result = await PaymentTransaction.findById(id).populate([
    { path: 'user_wallet', select: '_id token' },
    { path: 'payment_method', select: '_id name currency' },
    { path: 'package', select: '_id name token price' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }
  return result;
};

export const deletePaymentTransaction = async (id: string): Promise<void> => {
  const transaction = await PaymentTransaction.findById(id).lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  await PaymentTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

export const initiatePayment = async (
  userId: string,
  packageId: string,
  paymentMethodId: string,
  returnUrl: string,
  cancelUrl: string,
  session?: mongoose.ClientSession,
): Promise<{
  paymentTransaction: TPaymentTransaction;
  redirectUrl?: string;
  paymentUrl?: string;
}> => {
  // Get payment method
  const paymentMethod = await PaymentMethod.findById(paymentMethodId)
    .session(session || null)
    .lean();

  if (!paymentMethod || !paymentMethod.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment method not available');
  }

  // Get package
  const packageData = await Package.findById(packageId)
    .session(session || null)
    .lean();

  if (!packageData || !packageData.is_active) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found or inactive');
  }

  // Get or create user wallet
  let wallet = await UserWallet.findOne({ user: userId })
    .session(session || null)
    .lean();

  if (!wallet) {
    // Create wallet if doesn't exist
    const newWallet = await UserWallet.create(
      [
        {
          user: userId,
          package: packageId,
          token: 0,
        },
      ],
      { session },
    );
    wallet = newWallet[0].toObject() as NonNullable<typeof wallet>;
  }

  // Calculate amounts based on package currency
  const amountUsd = packageData.currency === 'USD' ? packageData.price : 0;
  const amountBdt = packageData.currency === 'BDT' ? packageData.price : 0;
  // TODO: Add exchange rate calculation if needed for currency conversion

  // Create payment transaction
  const paymentTransaction = await PaymentTransaction.create(
    [
      {
        user: userId,
        user_wallet: wallet._id,
        status: 'pending',
        payment_method: paymentMethodId,
        gateway_transaction_id: '', // Will be updated after gateway response
        package: packageId,
        amount_usd: amountUsd,
        amount_bdt: amountBdt,
      },
    ],
    { session },
  );

  // Initiate payment with gateway
  const gateway = PaymentGatewayFactory.create(paymentMethod);
  const paymentResponse = await gateway.initiatePayment({
    amount: packageData.price,
    currency: packageData.currency,
    packageId,
    userId,
    userWalletId: wallet._id.toString(),
    returnUrl,
    cancelUrl,
  });

  // Update transaction with gateway ID and session ID
  await PaymentTransaction.findByIdAndUpdate(
    paymentTransaction[0]._id,
    {
      gateway_transaction_id: paymentResponse.gatewayTransactionId,
      gateway_session_id: paymentResponse.gatewayTransactionId, // For Stripe, session ID is same as transaction ID
      gateway_response: {
        redirectUrl: paymentResponse.redirectUrl,
        paymentUrl: paymentResponse.paymentUrl,
        clientSecret: paymentResponse.clientSecret,
      },
    },
    { session },
  );

  return {
    paymentTransaction: paymentTransaction[0].toObject(),
    redirectUrl: paymentResponse.redirectUrl,
    paymentUrl: paymentResponse.paymentUrl,
  };
};

export const handlePaymentWebhook = async (
  paymentMethodId: string,
  payload: any,
  signature: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const paymentMethod = await PaymentMethod.findById(paymentMethodId)
    .session(session || null)
    .lean();

  if (!paymentMethod) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  const gateway = PaymentGatewayFactory.create(paymentMethod);
  const webhookResult = await gateway.handleWebhook(payload, signature);

  if (webhookResult.success || webhookResult.status) {
    // Find transaction by gateway_transaction_id or gateway_session_id
    const transaction = await PaymentTransaction.findOne({
      $or: [
        { gateway_transaction_id: webhookResult.transactionId },
        { gateway_session_id: webhookResult.transactionId },
      ],
    })
      .session(session || null)
      .lean();

    if (transaction) {
      // Prepare update data with gateway information
      const updateData: any = {
        gateway_status: webhookResult.status,
        gateway_response: payload, // Store raw webhook payload for debugging
      };

      // Update status only if it's not already success
      if (
        transaction.status !== 'success' &&
        webhookResult.status === 'success'
      ) {
        updateData.status = 'success';
        updateData.paid_at = new Date();

        // Update customer info if available in metadata
        if (webhookResult.metadata) {
          // Customer info might come from gateway response
        }
      } else if (
        webhookResult.status === 'failed' &&
        transaction.status !== 'failed'
      ) {
        updateData.status = 'failed';
        updateData.failure_reason = 'Payment failed at gateway';
      }

      await PaymentTransaction.findByIdAndUpdate(transaction._id, updateData, {
        session,
      });

      // If status changed to success, trigger token allocation
      if (updateData.status === 'success' && transaction.status !== 'success') {
        await updatePaymentTransactionStatus(
          transaction._id.toString(),
          'success',
          session,
        );
      }
    }
  }
};
