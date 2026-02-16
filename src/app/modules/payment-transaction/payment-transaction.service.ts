import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import config from '../../config';
import { PaymentGatewayFactory } from '../../payment-gateways';
import { RabbitMQ } from '../../rabbitmq';
import { CouponServices } from '../coupon/coupon.service';
import { PackagePlan } from '../package-plan/package-plan.model';
import { Package } from '../package/package.model';
import { PaymentMethod } from '../payment-method/payment-method.model';
import { Plan } from '../plan/plan.model';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { PaymentAuditLog } from './payment-audit.model';
import { PaymentStateMachine } from './payment-state-machine';
import { PaymentTransaction } from './payment-transaction.model';
import { TPaymentTransaction } from './payment-transaction.type';
import { sendPaymentNotificationEmail } from './payment-transaction.utils';
import { handlePaymentCompleted } from './payment.consumers';
import { PaymentEventPayload } from './payment.events';

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

  // Set email from wallet if not provided
  if (!data.email && wallet.email) {
    data.email = wallet.email;
  }

  const result = await PaymentTransaction.create([data], { session });
  return result[0].toObject();
};

export const updatePaymentTransactionStatus = async (
  id: string,
  status: TPaymentTransaction['status'],
  session?: mongoose.ClientSession,
  auditMetadata?: any,
  additionalUpdates?: Partial<TPaymentTransaction>,
): Promise<TPaymentTransaction> => {
  const transaction = await PaymentTransaction.findById(id)
    .session(session || null)
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  // 1. Validate State Transition
  // This prevents invalid updates like Success -> Failed
  PaymentStateMachine.validate(transaction.status, status);

  // If status is already same, return immediately (Idempotency)
  // UNLESS there are additional updates (e.g. customer info)
  if (
    transaction.status === status &&
    (!additionalUpdates || Object.keys(additionalUpdates).length === 0)
  ) {
    return transaction;
  }

  const updateData: any = {
    status,
    ...additionalUpdates,
  };

  if (status === 'success') {
    updateData.paid_at = new Date();
  } else if (status === 'failed') {
    updateData.failed_at = new Date();
  } else if (status === 'refunded') {
    updateData.refunded_at = new Date();
  }

  // 2. Perform Atomic Update
  const updatedTransaction = await PaymentTransaction.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      session,
      runValidators: true,
    },
  ).lean();

  if (!updatedTransaction) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update transaction status',
    );
  }

  // 3. Create Audit Log (Best effort, non-blocking)
  try {
    PaymentAuditLog.create([
      {
        transactionId: id,
        previousStatus: transaction.status,
        newStatus: status,
        source: auditMetadata?.source || 'SYSTEM',
        metadata: auditMetadata,
        reason: auditMetadata?.reason,
      },
    ]);
  } catch (auditError) {
    console.error('Failed to create audit log', auditError);
  }

  // 4. Trigger Side Effects (Event Driven)
  if (status === 'success') {
    const payload: PaymentEventPayload = {
      transactionId: id,
      userId: updatedTransaction.user.toString(),
      amount: updatedTransaction.amount,
      currency: updatedTransaction.currency,
      paymentMethodId: updatedTransaction.payment_method.toString(),
      packageId: updatedTransaction.package.toString(),
      planId: updatedTransaction.plan.toString(),
      timestamp: new Date(),
    };

    // If session is active, we should trigger events AFTER commit.
    // However, since we don't control the commit here (it might be passed in),
    // we rely on the event handling mechanism to be robust.
    // Ideally, we'd use `session.on('commit')` but that's complex since session is optional.

    // Using RabbitMQ if enabled, else direct call
    // Direct call for now to ensure reliability
    try {
      await handlePaymentCompleted(payload, session);
    } catch (directError) {
      console.error(
        '[PaymentService] Direct handlePaymentCompleted failed:',
        directError,
      );
      // We continue to publish to RabbitMQ so the consumer can retry later
    }

    // Also publish event for other services (Analytics, Notifications) or as backup
    if (config.rabbitmq_enabled) {
      try {
        await RabbitMQ.publishToQueue('payment.completed', payload);
      } catch (mqError) {
        console.error(
          '[PaymentService] Failed to publish to RabbitMQ:',
          mqError,
        );
      }
    }
  } else if (status === 'failed') {
    // Handle failure side effects (e.g. Email)
    if (updatedTransaction.email) {
      try {
        sendPaymentNotificationEmail('failed', updatedTransaction);
      } catch (e) {
        console.error('Failed to send failure email', e);
      }
    }
  }

  return updatedTransaction;
};

export const getPaymentTransactions = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPaymentTransaction[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { user, email, user_wallet, status, payment_method, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (user) {
    filter.user = new mongoose.Types.ObjectId(user as string);
  }

  if (user_wallet) {
    filter.user_wallet = new mongoose.Types.ObjectId(user_wallet as string);
  }
  if (email) {
    filter.email = email;
  }

  if (status) {
    filter.status = status;
  }

  if (payment_method) {
    filter.payment_method = new mongoose.Types.ObjectId(
      payment_method as string,
    );
  }

  const paymentTransactionQuery = new AppAggregationQuery<TPaymentTransaction>(
    PaymentTransaction,
    { ...rest, ...filter },
  );

  paymentTransactionQuery
    .populate([
      { path: 'user_wallet', select: '_id credits', justOne: true },
      { path: 'payment_method', select: '_id name currency', justOne: true },
      { path: 'package', select: '_id name', justOne: true },
      { path: 'plan', select: '_id name duration', justOne: true },
      { path: 'price', select: '_id price credits', justOne: true }, // package-plan
      {
        path: 'coupon',
        select: '_id code discount_type discount_value is_affiliate',
        justOne: true,
      },
    ])
    .search(['email', 'customer_email', 'gateway_transaction_id'])
    .filter()
    .sort([
      'status',
      'amount',
      'currency',
      'gateway_transaction_id',
      'gateway_session_id',
      'paid_at',
      'failed_at',
      'refunded_at',
      'customer_email',
      'customer_name',
      'created_at',
      'updated_at',
    ] as any)
    .paginate()
    .fields();

  const result = await paymentTransactionQuery.execute([
    {
      key: 'success',
      filter: { status: 'success' },
    },
    {
      key: 'pending',
      filter: { status: 'pending' },
    },
    {
      key: 'failed',
      filter: { status: 'failed' },
    },
  ]);

  return result;
};

export const getPaymentTransaction = async (
  id: string,
  userId?: string,
): Promise<TPaymentTransaction> => {
  const result = await PaymentTransaction.findById(id)
    .populate([
      { path: 'user_wallet', select: '_id credits' },
      { path: 'payment_method', select: '_id name currency' },
      { path: 'package', select: '_id name' },
      { path: 'plan', select: '_id name duration' },
      { path: 'price', select: '_id price credits' }, // package-plan
      {
        path: 'coupon',
        select: '_id code discount_type discount_value is_affiliate',
      },
      // Note: user is NOT populated because user database is separate
      // user field contains ObjectId directly
    ])
    .lean();
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  // If userId is provided, verify the transaction belongs to this user
  // user field is ObjectId, not populated
  if (userId) {
    const transactionUserId = (
      result.user as mongoose.Types.ObjectId
    ).toString();
    if (transactionUserId !== userId.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You do not have permission to access this payment transaction',
      );
    }
  }

  return result;
};

export const getPaymentTransactionStatus = async (
  id: string,
  userId?: string,
): Promise<{
  status: TPaymentTransaction['status'];
  gateway_status?: string;
  amount: number;
  currency: string;
  payment_method_id?: string;
  payment_method_name?: string;
  return_url?: string;
  cancel_url?: string;
}> => {
  const transaction = await PaymentTransaction.findById(id)
    .select(
      'status gateway_status amount currency user payment_method return_url cancel_url',
    )
    .populate('payment_method', 'name')
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  // If userId is provided, verify the transaction belongs to this user
  // user field is ObjectId, not populated
  if (userId) {
    const transactionUserId = (
      transaction.user as mongoose.Types.ObjectId
    ).toString();
    if (transactionUserId !== userId.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You do not have permission to access this payment transaction',
      );
    }
  }

  // Handle payment_method (can be ObjectId or populated object)
  let paymentMethodId: string | undefined;
  let paymentMethodName: string | undefined;

  if (transaction.payment_method) {
    if (
      typeof transaction.payment_method === 'object' &&
      '_id' in transaction.payment_method &&
      'name' in transaction.payment_method
    ) {
      // Populated payment method
      const populatedMethod = transaction.payment_method as {
        _id: mongoose.Types.ObjectId;
        name: string;
      };
      paymentMethodId = populatedMethod._id.toString();
      paymentMethodName = populatedMethod.name;
    } else if (transaction.payment_method instanceof mongoose.Types.ObjectId) {
      // Just ObjectId
      paymentMethodId = transaction.payment_method.toString();
    } else if (
      typeof transaction.payment_method === 'object' &&
      '_id' in transaction.payment_method
    ) {
      // ObjectId-like object
      const methodId = (
        transaction.payment_method as { _id: mongoose.Types.ObjectId }
      )._id;
      paymentMethodId = methodId.toString();
    }
  }

  return {
    status: transaction.status,
    gateway_status: transaction.gateway_status,
    amount: transaction.amount,
    currency: transaction.currency,
    payment_method_id: paymentMethodId,
    payment_method_name: paymentMethodName,
    return_url: transaction.return_url,
    cancel_url: transaction.cancel_url,
  };
};

export const verifyPayment = async (
  id: string,
  session?: mongoose.ClientSession,
  userId?: string,
): Promise<{
  verified: boolean;
  status: string;
  transaction: TPaymentTransaction;
}> => {
  const transaction = await PaymentTransaction.findById(id)
    .session(session || null)
    .populate('payment_method')
    // Note: user is NOT populated because user database is separate
    // user field contains ObjectId directly
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  // If userId is provided, verify the transaction belongs to this user
  // user field is ObjectId, not populated
  if (userId) {
    const transactionUserId = (
      transaction.user as mongoose.Types.ObjectId
    ).toString();
    if (transactionUserId !== userId.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You do not have permission to verify this payment transaction',
      );
    }
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
      await updatePaymentTransactionStatus(id, 'success', session, {
        source: 'MANUAL_VERIFICATION',
        reason: 'Payment verified successfully at gateway',
        metadata: verificationResult,
      });
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
      await updatePaymentTransactionStatus(
        id,
        'failed',
        session,
        {
          source: 'MANUAL_VERIFICATION',
          reason: 'Payment verification failed at gateway',
          metadata: verificationResult,
        },
        {
          gateway_status: verificationResult.status,
          failure_reason: 'Payment verification failed',
        },
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
  coupon_code?: string;
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
    coupon_code,
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
          email: customerEmail,
          credits: 0,
        },
      ],
      { session },
    );
    wallet = newWallet[0].toObject() as NonNullable<typeof wallet>;
  }

  const gatewayAmount =
    paymentMethod.currency === 'USD'
      ? packagePlan.price.USD
      : packagePlan.price.BDT;

  // Coupon handling
  let discountAmount = 0;
  let couponId: mongoose.Types.ObjectId | undefined;

  if (coupon_code) {
    const { coupon, discount_amount } = await CouponServices.validateCoupon(
      coupon_code,
      packageId,
      planId,
      paymentMethod.currency as 'USD' | 'BDT',
    );
    discountAmount = discount_amount;
    couponId = coupon._id;
  }

  const finalAmount = gatewayAmount - discountAmount;

  // Validate amount is greater than 0
  if (finalAmount < 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Calculated payment amount cannot be negative`,
    );
  }

  // Create payment transaction with frontend URLs stored
  const paymentTransaction = await PaymentTransaction.create(
    [
      {
        user: userId,
        email: customerEmail,
        user_wallet: wallet._id,
        status: 'pending',
        payment_method: paymentMethodId,
        gateway_transaction_id: '',
        package: packageId,
        plan: planId,
        price: packagePlan._id, // Store package-plan document _id
        coupon: couponId,
        discount_amount: discountAmount,
        amount: finalAmount,
        currency: paymentMethod.currency,
        return_url: returnUrl, // Store frontend return URL
        cancel_url: cancelUrl, // Store frontend cancel URL
        is_test: paymentMethod.is_test || false,
      },
    ],
    { session },
  );

  try {
    // Construct webhook URL for SSLCommerz IPN
    const webhookUrl = `${config.url}/api/payment-transactions/webhook/${paymentMethodId}`;

    // Construct server redirect URLs (gateway will redirect to these)
    const serverReturnUrl = `${config.url}/api/payment-transactions/redirect?transaction_id=${paymentTransaction[0]._id}&status=success`;
    const serverCancelUrl = `${config.url}/api/payment-transactions/redirect?transaction_id=${paymentTransaction[0]._id}&status=cancel`;

    // Initiate payment with gateway (using server redirect URLs)
    const gateway = PaymentGatewayFactory.create(paymentMethod);
    const paymentResponse = await gateway.initiatePayment({
      amount: finalAmount,
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
  // 1. Resolve Transaction ID
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

  // 2. Fetch Transaction
  const transaction = await PaymentTransaction.findById(transactionId)
    .populate('payment_method')
    .lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  const paymentMethod = transaction.payment_method as any;
  let redirectUrl = transaction.return_url || '/';
  let statusUpdated = false;

  try {
    // 3. Process via Gateway
    const gateway = PaymentGatewayFactory.create(paymentMethod);
    const result = await gateway.processRedirect(params);

    // 4. Update Status based on result
    if (result.status === 'success') {
      await updatePaymentTransactionStatus(
        transactionId,
        'success',
        undefined,
        {
          source: 'REDIRECT',
          reason: 'Gateway redirect verified success',
          metadata: result.gatewayResponse,
        },
      );
      statusUpdated = true;
    } else if (result.status === 'failed') {
      await updatePaymentTransactionStatus(transactionId, 'failed', undefined, {
        source: 'REDIRECT',
        reason: result.message || 'Gateway redirect reported failure',
        metadata: result.gatewayResponse,
      });
      redirectUrl = transaction.cancel_url || transaction.return_url || '/';
      statusUpdated = true;
    } else if (result.status === 'pending') {
      // Gateway says pending, handled by webhook
      // We still redirect to return_url (success page usually checks status)
    }
  } catch (err: any) {
    console.error('[PaymentRedirect] Processing Failed:', err);
    redirectUrl = transaction.cancel_url || transaction.return_url || '/';
  }

  // 5. Appending Frontend Params (Keep existing logic)
  const transactionDocumentId = transactionId;
  const paymentMethodId =
    transaction.payment_method &&
    typeof transaction.payment_method === 'object' &&
    '_id' in transaction.payment_method
      ? (transaction.payment_method._id as mongoose.Types.ObjectId).toString()
      : transaction.payment_method
        ? (transaction.payment_method as mongoose.Types.ObjectId).toString()
        : undefined;

  const updateUrlWithParams = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('transaction_id')) {
        urlObj.searchParams.set('transaction_id', transactionDocumentId);
      }
      if (paymentMethodId && !urlObj.searchParams.has('payment_method_id')) {
        urlObj.searchParams.set('payment_method_id', paymentMethodId);
      }
      return urlObj.toString();
    } catch {
      const separator = url.includes('?') ? '&' : '?';
      const paramsList: string[] = [];
      if (!url.includes('transaction_id=')) {
        paramsList.push(`transaction_id=${transactionDocumentId}`);
      }
      if (paymentMethodId && !url.includes('payment_method_id=')) {
        paramsList.push(`payment_method_id=${paymentMethodId}`);
      }
      return paramsList.length > 0
        ? `${url}${separator}${paramsList.join('&')}`
        : url;
    }
  };

  redirectUrl = updateUrlWithParams(redirectUrl);

  return { redirectUrl, statusUpdated };
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
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  let webhookResult;
  try {
    const gateway = PaymentGatewayFactory.create(paymentMethod);
    webhookResult = await gateway.handleWebhook(payload, signature);
  } catch (error: any) {
    console.error(
      `[Webhook] Gateway processing failed for ${paymentMethod.name}:`,
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

  console.log('[Webhook] Processing webhook result...', {
    transactionId: transaction._id.toString(),
    gatewayTransactionId: webhookResult.transactionId,
    status: webhookResult.status,
  });

  // Extract customer info from payload if available
  const additionalUpdates: any = {};
  if (payload.customer_email || payload.cus_email) {
    additionalUpdates.customer_email = (
      payload.customer_email || payload.cus_email
    )
      .toLowerCase()
      .trim();
  }
  if (
    payload.customer_details?.name ||
    payload.cus_name ||
    payload.customer_name
  ) {
    additionalUpdates.customer_name = (
      payload.customer_details?.name ||
      payload.cus_name ||
      payload.customer_name
    ).trim();
  }

  // Use the central status update logic which handles idempotency, events, and audit logs
  if (webhookResult.status === 'success') {
    await updatePaymentTransactionStatus(
      transaction._id.toString(),
      'success',
      session,
      {
        source: 'WEBHOOK',
        reason: 'Webhook confirmed success',
        metadata: {
          gatewayResponse: payload,
          webhookResult,
        },
      },
      additionalUpdates,
    );
  } else if (webhookResult.status === 'failed') {
    await updatePaymentTransactionStatus(
      transaction._id.toString(),
      'failed',
      session,
      {
        source: 'WEBHOOK',
        reason: 'Webhook confirmed failure',
        metadata: {
          gatewayResponse: payload,
          webhookResult,
        },
      },
      additionalUpdates,
    );
  }
};
