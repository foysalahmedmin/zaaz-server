import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import config from '../../config';
import { PaymentGatewayFactory } from '../../payment-gateways';
import { PackagePlan } from '../package-plan/package-plan.model';
import { Package } from '../package/package.model';
import { PaymentMethod } from '../payment-method/payment-method.model';
import { Plan } from '../plan/plan.model';
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
  // Use atomic update to prevent double processing for success status
  if (status === 'success') {
    // First, try to update status atomically (only if not already success)
    const updateResult = await PaymentTransaction.findOneAndUpdate(
      {
        _id: id,
        status: { $ne: 'success' }, // Only update if not already success
      },
      {
        $set: {
          status: 'success',
          paid_at: new Date(),
        },
      },
      {
        new: true,
        session,
      },
    ).lean();

    if (!updateResult) {
      // Transaction already processed, fetch and return
      const existing = await PaymentTransaction.findById(id)
        .session(session || null)
        .lean();
      if (!existing) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Payment transaction not found',
        );
      }
      return existing;
    }

    // Get package-plan document using transaction.price (package-plan _id)
    const packagePlan = await PackagePlan.findById(updateResult.price)
      .populate('plan')
      .session(session || null)
      .lean();

    if (!packagePlan) {
      throw new AppError(httpStatus.NOT_FOUND, 'Package-plan not found');
    }

    const planData = packagePlan.plan as any;

    // Prepare wallet update data
    const updateWalletData: any = {
      $inc: { token: packagePlan.token },
      package: updateResult.package, // Update to newly purchased package
      plan: updateResult.plan, // Update to purchased plan
    };

    // Calculate and set expires_at using plan's duration
    if (planData && planData.duration) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + planData.duration);
      updateWalletData.expires_at = expiresAt;
    }

    // Update wallet with package tokens, package reference, plan, and expiration
    await UserWallet.findByIdAndUpdate(
      updateResult.user_wallet,
      updateWalletData,
      { session },
    );

    // Check if token transaction already exists for this payment transaction
    // This prevents duplicate token transactions in case of race conditions
    const existingTokenTransaction = await TokenTransaction.findOne({
      payment_transaction: id,
      type: 'increase',
      increase_source: 'payment',
    })
      .session(session || null)
      .lean();

    if (!existingTokenTransaction) {
      // Create token transaction record only if it doesn't exist
      await TokenTransaction.create(
        [
          {
            user: updateResult.user,
            user_wallet: updateResult.user_wallet,
            type: 'increase',
            token: packagePlan.token,
            increase_source: 'payment',
            payment_transaction: id,
            plan: updateResult.plan,
          },
        ],
        { session },
      );
    }

    return updateResult;
  }

  // For non-success status updates, use regular update
  const transaction = await PaymentTransaction.findById(id)
    .session(session || null)
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  const updateData: any = { status };

  if (status === 'refunded' && transaction.status !== 'refunded') {
    updateData.refunded_at = new Date();
  }

  if (status === 'failed' && transaction.status !== 'failed') {
    updateData.failed_at = new Date();
  }

  const result = await PaymentTransaction.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).session(session || null);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  return result;
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
      { path: 'package', select: '_id name' },
      { path: 'plan', select: '_id name duration' },
      { path: 'price', select: '_id price token' }, // package-plan
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
    { path: 'package', select: '_id name' },
    { path: 'plan', select: '_id name duration' },
    { path: 'price', select: '_id price token' }, // package-plan
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }
  return result;
};

export const getPaymentTransactionStatus = async (
  id: string,
): Promise<{
  status: TPaymentTransaction['status'];
  gateway_status?: string;
  amount: number;
  currency: string;
}> => {
  const transaction = await PaymentTransaction.findById(id)
    .select('status gateway_status amount currency')
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  return {
    status: transaction.status,
    gateway_status: transaction.gateway_status,
    amount: transaction.amount,
    currency: transaction.currency,
  };
};

export const verifyPayment = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<{
  verified: boolean;
  status: string;
  transaction: TPaymentTransaction;
}> => {
  const transaction = await PaymentTransaction.findById(id)
    .session(session || null)
    .populate('payment_method')
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  const paymentMethod = transaction.payment_method as any;
  if (!paymentMethod) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  // Get gateway transaction ID
  const gatewayTransactionId =
    transaction.gateway_transaction_id || transaction.gateway_session_id;

  if (!gatewayTransactionId) {
    return {
      verified: false,
      status: 'No gateway transaction ID found',
      transaction,
    };
  }

  try {
    const gateway = PaymentGatewayFactory.create(paymentMethod);
    const verificationResult =
      await gateway.verifyPayment(gatewayTransactionId);

    // Update transaction with latest gateway status
    if (verificationResult.status !== transaction.gateway_status) {
      await PaymentTransaction.findByIdAndUpdate(
        id,
        {
          gateway_status: verificationResult.status,
        },
        { session },
      );
    }

    // If gateway says success but our status is not success, update it
    if (
      verificationResult.success &&
      transaction.status !== 'success' &&
      transaction.status !== 'refunded'
    ) {
      await updatePaymentTransactionStatus(id, 'success', session);
      const updatedTransaction = await PaymentTransaction.findById(id)
        .session(session || null)
        .lean();
      return {
        verified: true,
        status: 'success',
        transaction: updatedTransaction!,
      };
    }

    // If gateway says failed and our status is not failed, update it
    if (
      !verificationResult.success &&
      transaction.status !== 'failed' &&
      transaction.status !== 'refunded'
    ) {
      await PaymentTransaction.findByIdAndUpdate(
        id,
        {
          status: 'failed',
          gateway_status: verificationResult.status,
          failure_reason: 'Payment verification failed',
          failed_at: new Date(),
        },
        { session },
      );
      const updatedTransaction = await PaymentTransaction.findById(id)
        .session(session || null)
        .lean();
      return {
        verified: false,
        status: 'failed',
        transaction: updatedTransaction!,
      };
    }

    return {
      verified: verificationResult.success,
      status: transaction.status,
      transaction,
    };
  } catch (error: any) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      `Payment verification failed: ${error.message}`,
    );
  }
};

export const deletePaymentTransaction = async (id: string): Promise<void> => {
  const transaction = await PaymentTransaction.findById(id).lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  await PaymentTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

export const deletePaymentTransactionPermanent = async (
  id: string,
): Promise<void> => {
  const transaction = await PaymentTransaction.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  await PaymentTransaction.findByIdAndDelete(id);
};

export const deletePaymentTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await PaymentTransaction.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = transactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PaymentTransaction.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePaymentTransactionsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await PaymentTransaction.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = transactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PaymentTransaction.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePaymentTransaction = async (
  id: string,
): Promise<TPaymentTransaction> => {
  const transaction = await PaymentTransaction.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!transaction) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Payment transaction not found or not deleted',
    );
  }

  return transaction;
};

export const restorePaymentTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await PaymentTransaction.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredTransactions = await PaymentTransaction.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredTransactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const initiatePayment = async (options: {
  userId: string;
  packageId: string;
  planId: string;
  paymentMethodId: string;
  returnUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  session?: mongoose.ClientSession;
}): Promise<{
  payment_transaction: TPaymentTransaction;
  redirect_url?: string;
  payment_url?: string;
}> => {
  const {
    userId,
    packageId,
    planId,
    paymentMethodId,
    returnUrl,
    cancelUrl,
    customerEmail,
    customerName,
    customerPhone,
    session,
  } = options;
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

  // Validate plan exists and is active
  const plan = await Plan.findById(planId)
    .session(session || null)
    .lean();
  if (!plan || !plan.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Plan not found or not active');
  }

  // Get package-plan for this package+plan combination
  const packagePlan = await PackagePlan.findOne({
    package: packageId,
    plan: planId,
    is_active: true,
    is_deleted: { $ne: true },
  })
    .session(session || null)
    .lean();

  if (!packagePlan) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Package-plan not found or not active for this package and plan combination',
    );
  }

  // Get or create user wallet
  let wallet = await UserWallet.findOne({ user: userId })
    .session(session || null)
    .lean();

  if (!wallet) {
    // Create wallet if doesn't exist (without package - will be set on payment success)
    const newWallet = await UserWallet.create(
      [
        {
          user: userId,
          token: 0,
        },
      ],
      { session },
    );
    wallet = newWallet[0].toObject() as NonNullable<typeof wallet>;
  }

  // Get amount based on payment method currency
  const gatewayAmount =
    paymentMethod.currency === 'USD'
      ? packagePlan.price.USD
      : packagePlan.price.BDT;

  // Validate amount is greater than 0
  if (!gatewayAmount || gatewayAmount <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Package-plan price for ${paymentMethod.currency} is not available or invalid`,
    );
  }

  // Create payment transaction with frontend URLs stored
  const paymentTransaction = await PaymentTransaction.create(
    [
      {
        user: userId,
        user_wallet: wallet._id,
        status: 'pending',
        payment_method: paymentMethodId,
        gateway_transaction_id: '',
        package: packageId,
        plan: planId,
        price: packagePlan._id, // Store package-plan document _id
        amount: gatewayAmount,
        currency: paymentMethod.currency,
        return_url: returnUrl, // Store frontend return URL
        cancel_url: cancelUrl, // Store frontend cancel URL
      },
    ],
    { session },
  );

  try {
    // Construct webhook URL for SSLCommerz IPN
    const webhookUrl =
      paymentMethod.webhook_url ||
      `${config.url}/api/payment-transactions/webhook/${paymentMethodId}`;

    // Construct server redirect URLs (gateway will redirect to these)
    const serverReturnUrl = `${config.url}/api/payment-transactions/redirect?transaction_id=${paymentTransaction[0]._id}&status=success`;
    const serverCancelUrl = `${config.url}/api/payment-transactions/redirect?transaction_id=${paymentTransaction[0]._id}&status=cancel`;

    // Initiate payment with gateway (using server redirect URLs)
    const gateway = PaymentGatewayFactory.create(paymentMethod);
    const paymentResponse = await gateway.initiatePayment({
      amount: gatewayAmount,
      currency: paymentMethod.currency,
      packageId,
      userId,
      userWalletId: wallet._id.toString(),
      returnUrl: serverReturnUrl, // Use server redirect URL
      cancelUrl: serverCancelUrl, // Use server redirect URL
      ipnUrl: webhookUrl, // Pass IPN URL for SSLCommerz webhook notifications
      customerEmail,
      customerName,
      customerPhone, // Pass customer phone for SSLCommerz
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
      payment_transaction: paymentTransaction[0].toObject(),
      redirect_url: paymentResponse.redirectUrl,
      payment_url: paymentResponse.paymentUrl,
    };
  } catch (error: any) {
    // If gateway call fails, mark transaction as failed
    await PaymentTransaction.findByIdAndUpdate(
      paymentTransaction[0]._id,
      {
        status: 'failed',
        failure_reason: `Gateway initiation failed: ${error.message}`,
        failed_at: new Date(),
        gateway_response: {
          error: error.message,
        },
      },
      { session },
    );

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      `Payment gateway error: ${error.message}`,
    );
  }
};

export const handlePaymentRedirect = async (params: {
  transaction_id?: string | string[];
  status?: string | string[];
  val_id?: string | string[];
  tran_id?: string | string[];
  error?: string | string[];
  [key: string]: any;
}): Promise<{ redirectUrl: string; statusUpdated: boolean }> => {
  // Get transaction_id from various possible params
  const transactionId =
    (typeof params.transaction_id === 'string'
      ? params.transaction_id
      : params.transaction_id?.[0]) ||
    (typeof params.tran_id === 'string'
      ? params.tran_id
      : params.tran_id?.[0]) ||
    (typeof params.val_id === 'string' ? params.val_id : params.val_id?.[0]);

  if (!transactionId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Transaction ID is required for redirect',
    );
  }

  // Get transaction to retrieve stored frontend URLs
  const transaction = await PaymentTransaction.findById(transactionId).select(
    'return_url cancel_url status',
  );

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  // SSLCommerz success indicators: val_id (validation ID) or status=VALID
  const hasValId = params.val_id;
  const statusParam =
    typeof params.status === 'string' ? params.status : params.status?.[0];
  const hasError = params.error;

  // Determine final status
  let finalStatus: 'success' | 'failed' | 'cancel' | null = null;
  if (hasValId || statusParam === 'VALID' || statusParam === 'success') {
    finalStatus = 'success';
  } else if (
    hasError ||
    statusParam === 'FAILED' ||
    statusParam === 'failed' ||
    statusParam === 'cancel'
  ) {
    finalStatus = statusParam === 'cancel' ? 'cancel' : 'failed';
  } else if (statusParam) {
    // Map other status values
    if (statusParam.toLowerCase().includes('success')) {
      finalStatus = 'success';
    } else if (statusParam.toLowerCase().includes('cancel')) {
      finalStatus = 'cancel';
    } else {
      finalStatus = 'failed';
    }
  }

  // Update transaction status if needed
  let statusUpdated = false;
  if (finalStatus === 'success' && transaction.status !== 'success') {
    // Only update if not already success (prevent double processing)
    // Use updatePaymentTransactionStatus to also update wallet and create token transaction
    try {
      await updatePaymentTransactionStatus(transactionId, 'success');
      statusUpdated = true;
    } catch (error: unknown) {
      // If update fails (e.g., already processed by webhook), just update status for display
      // This can happen if webhook processed the payment before redirect
      const appError = error as AppError;
      if (appError.status === httpStatus.NOT_FOUND) {
        // Transaction not found, re-throw
        throw error;
      }
      // For other errors (e.g., already processed), update status for display
      await PaymentTransaction.findByIdAndUpdate(transactionId, {
        status: 'success',
        paid_at: new Date(),
      });
      statusUpdated = true;
    }
  } else if (finalStatus === 'failed' && transaction.status === 'pending') {
    await PaymentTransaction.findByIdAndUpdate(transactionId, {
      status: 'failed',
      failed_at: new Date(),
      failure_reason: 'Payment failed or cancelled by user',
    });
    statusUpdated = true;
  }

  // Determine redirect URL based on status
  let redirectUrl = transaction.return_url || '/';

  // Use cancel_url if status is cancel or failed, otherwise use return_url
  if (finalStatus === 'cancel' || finalStatus === 'failed') {
    redirectUrl = transaction.cancel_url || transaction.return_url || '/';
  }

  // Use transaction document _id (not gateway transaction ID) for verifyPayment API
  // This is the MongoDB ObjectId that verifyPayment expects
  const transactionDocumentId = transactionId;

  // Append transaction_id (document _id) and status to redirect URL if not already present
  try {
    const url = new URL(redirectUrl);
    if (!url.searchParams.has('transaction_id')) {
      url.searchParams.set('transaction_id', transactionDocumentId);
    }
    if (!url.searchParams.has('status') && finalStatus) {
      url.searchParams.set('status', finalStatus);
    }
    redirectUrl = url.toString();
  } catch {
    // If redirectUrl is not a valid URL, append query params manually
    const separator = redirectUrl.includes('?') ? '&' : '?';
    redirectUrl = `${redirectUrl}${separator}transaction_id=${transactionDocumentId}`;
    if (finalStatus) {
      redirectUrl += `&status=${finalStatus}`;
    }
  }

  // Update return_url and cancel_url in transaction document with proper transaction_id
  // This ensures the URLs always have the correct transaction_id for verifyPayment
  const updateData: any = {};
  if (transaction.return_url) {
    try {
      const returnUrlObj = new URL(transaction.return_url);
      if (!returnUrlObj.searchParams.has('transaction_id')) {
        returnUrlObj.searchParams.set('transaction_id', transactionDocumentId);
        updateData.return_url = returnUrlObj.toString();
      }
    } catch {
      // If return_url is not a valid URL, append query params manually
      const separator = transaction.return_url.includes('?') ? '&' : '?';
      updateData.return_url = `${transaction.return_url}${separator}transaction_id=${transactionDocumentId}`;
    }
  }
  if (transaction.cancel_url) {
    try {
      const cancelUrlObj = new URL(transaction.cancel_url);
      if (!cancelUrlObj.searchParams.has('transaction_id')) {
        cancelUrlObj.searchParams.set('transaction_id', transactionDocumentId);
        updateData.cancel_url = cancelUrlObj.toString();
      }
    } catch {
      // If cancel_url is not a valid URL, append query params manually
      const separator = transaction.cancel_url.includes('?') ? '&' : '?';
      updateData.cancel_url = `${transaction.cancel_url}${separator}transaction_id=${transactionDocumentId}`;
    }
  }

  // Update transaction document with updated URLs
  if (Object.keys(updateData).length > 0) {
    await PaymentTransaction.findByIdAndUpdate(transactionId, updateData);
  }

  return { redirectUrl, statusUpdated };
};

const prepareWebhookUpdateData = (
  transaction: TPaymentTransaction,
  webhookResult: { status?: string; metadata?: any },
  payload: any,
): { updateData: any; shouldTriggerSuccess: boolean } => {
  const updateData: any = {
    gateway_status: webhookResult.status,
    gateway_response: payload,
  };

  let shouldTriggerSuccess = false;

  // Handle success status
  if (transaction.status !== 'success' && webhookResult.status === 'success') {
    updateData.status = 'success';
    updateData.paid_at = new Date();
    shouldTriggerSuccess = true;

    // Update customer info if available in payload
    // Stripe: customer_email and customer_details.name
    // SSL Commerz: cus_email and cus_name
    if (payload.customer_email || payload.cus_email) {
      updateData.customer_email = (payload.customer_email || payload.cus_email)
        .toLowerCase()
        .trim();
    }
    if (
      payload.customer_details?.name ||
      payload.cus_name ||
      payload.customer_name
    ) {
      updateData.customer_name = (
        payload.customer_details?.name ||
        payload.cus_name ||
        payload.customer_name
      ).trim();
    }
  }
  // Handle failed status
  else if (
    webhookResult.status === 'failed' &&
    transaction.status !== 'failed'
  ) {
    updateData.status = 'failed';
    updateData.failure_reason = 'Payment failed at gateway';
    updateData.failed_at = new Date();
  }

  return { updateData, shouldTriggerSuccess };
};

const findTransactionByGatewayId = async (
  transactionId: string,
  session?: mongoose.ClientSession,
): Promise<(TPaymentTransaction & { _id: mongoose.Types.ObjectId }) | null> => {
  return await PaymentTransaction.findOne({
    $or: [
      { gateway_transaction_id: transactionId },
      { gateway_session_id: transactionId },
    ],
  })
    .session(session || null)
    .lean();
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
    console.error(`[Webhook] Payment method not found: ${paymentMethodId}`);
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  let webhookResult;
  try {
    const gateway = PaymentGatewayFactory.create(paymentMethod);
    webhookResult = await gateway.handleWebhook(payload, signature);
  } catch (error: any) {
    console.error(
      `[Webhook] Gateway webhook processing failed for ${paymentMethod.name}:`,
      error.message,
    );
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook processing failed: ${error.message}`,
    );
  }

  if (!webhookResult.success && !webhookResult.status) {
    return;
  }

  const transaction = await findTransactionByGatewayId(
    webhookResult.transactionId,
    session,
  );

  if (!transaction) {
    console.warn(
      `[Webhook] Transaction not found for gateway ID: ${webhookResult.transactionId}`,
    );
    return;
  }

  const { updateData, shouldTriggerSuccess } = prepareWebhookUpdateData(
    transaction,
    webhookResult,
    payload,
  );

  // Use atomic update to prevent double processing
  // Only update if status is not already success
  const updateResult = await PaymentTransaction.findOneAndUpdate(
    {
      _id: transaction._id,
      status: { $ne: 'success' }, // Only update if not already success
    },
    updateData,
    {
      new: true,
      session,
    },
  );

  if (!updateResult) {
    return;
  }

  // Only trigger success if update was successful and status changed to success
  if (
    shouldTriggerSuccess &&
    updateResult &&
    updateResult.status === 'success'
  ) {
    await updatePaymentTransactionStatus(
      transaction._id.toString(),
      'success',
      session,
    );
  }
};
