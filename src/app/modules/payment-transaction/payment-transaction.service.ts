import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import config from '../../config';
import { PaymentGatewayFactory } from '../../payment-gateways';
import { Coupon } from '../coupon/coupon.model';
import { CouponServices } from '../coupon/coupon.service';
import { CreditsTransaction } from '../credits-transaction/credits-transaction.model';
import { PackagePlan } from '../package-plan/package-plan.model';
import { PackageTransaction } from '../package-transaction/package-transaction.model';
import { Package } from '../package/package.model';
import { PaymentMethod } from '../payment-method/payment-method.model';
import { Plan } from '../plan/plan.model';
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

    let transactionData:
      | (TPaymentTransaction & { _id: mongoose.Types.ObjectId })
      | null = null;

    let shouldProcessCoupon = false;
    if (!updateResult) {
      // Transaction already processed, fetch and check if wallet update is needed
      const existing = await PaymentTransaction.findById(id)
        .session(session || null)
        .lean();
      if (!existing) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Payment transaction not found',
        );
      }
      transactionData = existing;

      // Check if wallet update is needed (if transaction is already success but wallet might not be updated)
      // This can happen if webhook updated status but wallet update failed or was skipped
      console.log(
        '[Payment Success] Transaction already success, checking if wallet update needed...',
        {
          transactionId: id,
          userWallet: transactionData.user_wallet,
        },
      );

      // Check if credits transaction exists for this payment transaction
      const existingCreditsTransaction = await CreditsTransaction.findOne({
        payment_transaction: id,
        type: 'increase',
        increase_source: 'payment',
      })
        .session(session || null)
        .lean();

      if (existingCreditsTransaction) {
        // Credits transaction exists, wallet should be updated, just return
        console.log(
          '[Payment Success] Credits transaction already exists, wallet should be updated, skipping',
        );
        return transactionData;
      }

      // Credits transaction doesn't exist, wallet update is needed
      console.log(
        '[Payment Success] Credits transaction not found, wallet update needed even though transaction is already success',
      );
      // Continue with wallet update logic below using transactionData
      shouldProcessCoupon = true;
    } else {
      // updateResult is the transaction data we'll use
      transactionData = updateResult;
      shouldProcessCoupon = true;
    }

    // Get package-plan document using transaction.price (package-plan _id)
    const packagePlan = await PackagePlan.findById(transactionData.price)
      .populate('plan')
      .session(session || null)
      .lean();

    if (!packagePlan) {
      throw new AppError(httpStatus.NOT_FOUND, 'Package-plan not found');
    }

    const planData = packagePlan.plan as any;

    // Prepare wallet update data
    const updateWalletData: any = {
      $inc: { credits: packagePlan.credits },
      package: transactionData.package, // Update to newly purchased package
      plan: transactionData.plan, // Update to purchased plan
      type: 'paid',
    };

    // Calculate and set expires_at using plan's duration
    if (planData && planData.duration) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + planData.duration);
      updateWalletData.expires_at = expiresAt;
    }

    // Update wallet with package credits, package reference, plan, and expiration
    try {
      console.log('[Payment Success] Updating wallet...', {
        walletId: transactionData.user_wallet,
        transactionId: id,
        creditsToAdd: packagePlan.credits,
        packageId: transactionData.package,
        planId: transactionData.plan,
      });

      const walletUpdateResult = await UserWallet.findByIdAndUpdate(
        transactionData.user_wallet,
        updateWalletData,
        { session, new: true },
      );

      if (!walletUpdateResult) {
        console.error('[Payment Success] Wallet not found for update:', {
          walletId: transactionData.user_wallet,
          transactionId: id,
        });
        throw new AppError(
          httpStatus.NOT_FOUND,
          'User wallet not found for update',
        );
      }

      console.log('[Payment Success] Wallet updated successfully:', {
        walletId: transactionData.user_wallet,
        transactionId: id,
        creditsAdded: packagePlan.credits,
        packageId: transactionData.package,
        planId: transactionData.plan,
        newCreditsBalance: walletUpdateResult.credits,
      });
    } catch (error) {
      console.error('[Payment Success] Failed to update wallet:', {
        walletId: transactionData.user_wallet,
        transactionId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    // Check if credits transaction already exists for this payment transaction
    // This prevents duplicate credits transactions in case of race conditions
    const existingCreditsTransaction = await CreditsTransaction.findOne({
      payment_transaction: id,
      type: 'increase',
      increase_source: 'payment',
    })
      .session(session || null)
      .lean();

    if (!existingCreditsTransaction) {
      // Create credits transaction record only if it doesn't exist
      try {
        console.log('[Payment Success] Creating credits transaction...', {
          transactionId: id,
          creditsAmount: packagePlan.credits,
          userId: transactionData.user,
          userWallet: transactionData.user_wallet,
        });

        await CreditsTransaction.create(
          [
            {
              user: transactionData.user, // ObjectId directly, not populated
              user_wallet: transactionData.user_wallet,
              email: transactionData.email,
              type: 'increase',
              credits: packagePlan.credits,
              increase_source: 'payment',
              payment_transaction: id,
              plan: transactionData.plan,
            },
          ],
          { session },
        );
        console.log('[Payment Success] Credits transaction created:', {
          transactionId: id,
          creditsAmount: packagePlan.credits,
          userId: transactionData.user,
        });
      } catch (error) {
        console.error(
          '[Payment Success] Failed to create credits transaction:',
          {
            transactionId: id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        );
        throw error;
      }
    } else {
      console.log(
        '[Payment Success] Credits transaction already exists, skipping:',
        {
          transactionId: id,
        },
      );
    }

    // Check if package transaction already exists for this payment transaction
    // This prevents duplicate package transactions in case of race conditions
    const existingPackageTransaction = await PackageTransaction.findOne({
      payment_transaction: id,
      increase_source: 'payment',
    })
      .session(session || null)
      .lean();

    if (!existingPackageTransaction) {
      // Create package transaction record only if it doesn't exist
      try {
        console.log('[Payment Success] Creating package transaction...', {
          transactionId: id,
          packageId: transactionData.package,
          planId: transactionData.plan,
          creditsAmount: packagePlan.credits,
          userId: transactionData.user,
          userWallet: transactionData.user_wallet,
        });

        await PackageTransaction.create(
          [
            {
              user: transactionData.user,
              user_wallet: transactionData.user_wallet,
              email: transactionData.email,
              package: transactionData.package,
              plan: transactionData.plan,
              credits: packagePlan.credits,
              increase_source: 'payment',
              payment_transaction: id,
            },
          ],
          { session },
        );
        console.log('[Payment Success] Package transaction created:', {
          transactionId: id,
          packageId: transactionData.package,
          planId: transactionData.plan,
          creditsAmount: packagePlan.credits,
        });
      } catch (error) {
        console.error(
          '[Payment Success] Failed to create package transaction:',
          {
            transactionId: id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        );
        // Don't throw error, just log it - package transaction is for tracking only
      }
    } else {
      console.log(
        '[Payment Success] Package transaction already exists, skipping:',
        {
          transactionId: id,
        },
      );
    }

    // Increment coupon usage count if applicable (only once when status transitions to success)
    if (shouldProcessCoupon && transactionData.coupon) {
      try {
        console.log('[Payment Success] Incrementing coupon usage count...', {
          couponId: transactionData.coupon,
          transactionId: id,
        });

        const couponDoc = await Coupon.findByIdAndUpdate(
          transactionData.coupon,
          { $inc: { usage_count: 1 } },
          { session, new: true },
        ).lean();

        // Send report if it is an affiliate coupon
        if (couponDoc && couponDoc.is_affiliate) {
          try {
            // await saveAffiliateCouponReport({
            //   coupon_code: couponDoc.code,
            //   price:
            //     transactionData.amount + (transactionData.discount_amount || 0),
            //   amount: transactionData.amount,
            //   discount_amount: transactionData.discount_amount || 0,
            //   currency: transactionData.currency,
            //   transaction_id: transactionData._id.toString(),
            //   user_id: transactionData.user.toString(),
            //   user_email: transactionData.email,
            // });
          } catch (reportError) {
            console.error(
              '[Payment Success] Affiliate report failed to send:',
              {
                transactionId: id,
                error:
                  reportError instanceof Error
                    ? reportError.message
                    : String(reportError),
              },
            );
          }
        }
      } catch (error) {
        console.error(
          '[Payment Success] Failed to process coupon updates/reporting:',
          {
            couponId: transactionData.coupon,
            transactionId: id,
            error: error instanceof Error ? error.message : String(error),
          },
        );
        // Don't throw error, just log it - coupon tracking/reporting is secondary to payment
      }
    }

    return transactionData;
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

  // Get transaction to retrieve stored frontend URLs and payment_method_id
  const transaction = await PaymentTransaction.findById(transactionId)
    .select(
      'return_url cancel_url status payment_method gateway_transaction_id',
    )
    .populate('payment_method') // Populate to get payment method details
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  // Extract payment method
  const paymentMethod = transaction.payment_method as any;

  // **bKash Execute Payment Logic**
  // bKash requires explicit payment execution after user authorization
  if (paymentMethod && paymentMethod.value === 'bkash') {
    console.log(
      '[bKash Redirect] Processing bKash callback, executing payment...',
    );

    // Extract paymentID from params (bKash sends this in callback)
    const paymentID =
      (typeof params.paymentID === 'string'
        ? params.paymentID
        : params.paymentID?.[0]) ||
      (typeof params.payment_id === 'string'
        ? params.payment_id
        : params.payment_id?.[0]) ||
      transaction.gateway_transaction_id;

    if (!paymentID) {
      console.error('[bKash Redirect] No paymentID found in callback');
      // Redirect to cancel URL
      const redirectUrl =
        transaction.cancel_url || transaction.return_url || '/';
      return { redirectUrl, statusUpdated: false };
    }

    try {
      // Create gateway instance
      const gateway = PaymentGatewayFactory.create(paymentMethod);

      // Check if gateway supports executePayment
      if (gateway.executePayment) {
        console.log('[bKash Redirect] Executing payment:', paymentID);

        // Execute payment
        const executeResult = await gateway.executePayment(paymentID);

        console.log('[bKash Redirect] Payment execution result:', {
          statusCode: executeResult.statusCode,
          transactionStatus: executeResult.transactionStatus,
          trxID: executeResult.trxID,
        });

        // Check if payment was successful
        if (
          executeResult.statusCode === '0000' &&
          executeResult.transactionStatus === 'Completed'
        ) {
          console.log(
            '[bKash Redirect] Payment successful, updating transaction...',
          );

          // Update transaction to success (this will also update wallet)
          await updatePaymentTransactionStatus(transactionId, 'success');

          // Update with bKash transaction ID and response
          await PaymentTransaction.findByIdAndUpdate(transactionId, {
            gateway_status: 'Completed',
            gateway_response: executeResult,
          });

          console.log('[bKash Redirect] Transaction updated to success');

          // Update local transaction object for redirect URL determination
          transaction.status = 'success';
        } else {
          console.log('[bKash Redirect] Payment failed or incomplete');

          // Update transaction to failed
          await PaymentTransaction.findByIdAndUpdate(transactionId, {
            status: 'failed',
            gateway_status: executeResult.transactionStatus,
            failure_reason:
              executeResult.statusMessage || 'Payment execution failed',
            failed_at: new Date(),
            gateway_response: executeResult,
          });

          // Update local transaction object for redirect URL determination
          transaction.status = 'failed';
        }
      }
    } catch (error: any) {
      console.error('[bKash Redirect] Payment execution error:', error.message);

      // Mark transaction as failed
      await PaymentTransaction.findByIdAndUpdate(transactionId, {
        status: 'failed',
        failure_reason: `bKash execution failed: ${error.message}`,
        failed_at: new Date(),
      });

      // Update local transaction object for redirect URL determination
      transaction.status = 'failed';
    }
  }

  // Log redirect parameters for debugging
  console.log(
    '[Redirect] Processing redirect (webhook will handle status update):',
    {
      transactionId,
      currentStatus: transaction.status,
      hasValId: !!params.val_id,
      statusParam:
        typeof params.status === 'string' ? params.status : params.status?.[0],
      hasError: !!params.error,
    },
  );

  // Determine redirect URL based on params (for user experience only)
  // Webhook will handle actual status update and wallet processing
  let redirectUrl = transaction.return_url || '/';

  // Check if params suggest failure/cancel
  const statusParam =
    typeof params.status === 'string' ? params.status : params.status?.[0];
  const hasError =
    params.error &&
    (typeof params.error === 'string'
      ? params.error
      : params.error?.[0] || ''
    ).trim() !== '';

  // Use cancel_url if params suggest failure/cancel OR if transaction status is failed
  if (
    hasError ||
    statusParam === 'FAILED' ||
    statusParam === 'failed' ||
    statusParam === 'cancel' ||
    transaction.status === 'failed'
  ) {
    redirectUrl = transaction.cancel_url || transaction.return_url || '/';
    console.log('[Redirect] Redirecting to cancel URL based on params');
  } else {
    console.log(
      '[Redirect] Redirecting to success URL (webhook will confirm payment)',
    );
  }

  // Use transaction document _id for frontend polling
  const transactionDocumentId = transactionId;
  const paymentMethodId =
    transaction.payment_method &&
    typeof transaction.payment_method === 'object' &&
    '_id' in transaction.payment_method
      ? (transaction.payment_method._id as mongoose.Types.ObjectId).toString()
      : transaction.payment_method
        ? (transaction.payment_method as mongoose.Types.ObjectId).toString()
        : undefined;

  // Append transaction_id and payment_method_id to redirect URL for frontend polling
  try {
    const url = new URL(redirectUrl);
    if (!url.searchParams.has('transaction_id')) {
      url.searchParams.set('transaction_id', transactionDocumentId);
    }
    if (paymentMethodId && !url.searchParams.has('payment_method_id')) {
      url.searchParams.set('payment_method_id', paymentMethodId);
    }
    redirectUrl = url.toString();
  } catch {
    // If redirectUrl is not a valid URL, append query params manually
    const separator = redirectUrl.includes('?') ? '&' : '?';
    const params = [`transaction_id=${transactionDocumentId}`];
    if (paymentMethodId) {
      params.push(`payment_method_id=${paymentMethodId}`);
    }
    redirectUrl = `${redirectUrl}${separator}${params.join('&')}`;
  }

  // Update return_url and cancel_url in transaction document with proper transaction_id and payment_method_id
  // This ensures the URLs always have the correct params for frontend polling
  // Only update if URLs don't already have these params to avoid unnecessary writes
  const updateData: any = {};

  const updateUrlWithParams = (url: string): string | null => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      let updated = false;
      if (!urlObj.searchParams.has('transaction_id')) {
        urlObj.searchParams.set('transaction_id', transactionDocumentId);
        updated = true;
      }
      if (paymentMethodId && !urlObj.searchParams.has('payment_method_id')) {
        urlObj.searchParams.set('payment_method_id', paymentMethodId);
        updated = true;
      }
      return updated ? urlObj.toString() : null;
    } catch {
      // If URL is not valid, append query params manually
      const params: string[] = [];
      if (!url.includes('transaction_id=')) {
        params.push(`transaction_id=${transactionDocumentId}`);
      }
      if (paymentMethodId && !url.includes('payment_method_id=')) {
        params.push(`payment_method_id=${paymentMethodId}`);
      }
      if (params.length > 0) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${params.join('&')}`;
      }
      return null; // Already has all params
    }
  };

  if (transaction.return_url) {
    const updatedReturnUrl = updateUrlWithParams(transaction.return_url);
    if (updatedReturnUrl) {
      updateData.return_url = updatedReturnUrl;
    }
  }

  if (transaction.cancel_url) {
    const updatedCancelUrl = updateUrlWithParams(transaction.cancel_url);
    if (updatedCancelUrl) {
      updateData.cancel_url = updatedCancelUrl;
    }
  }

  // Update transaction document with updated URLs (only if needed)
  // Use atomic update to ensure consistency
  if (Object.keys(updateData).length > 0) {
    await PaymentTransaction.findByIdAndUpdate(
      transactionId,
      { $set: updateData },
      { new: true },
    );
  }

  // NO STATUS UPDATE - Webhook will handle all processing
  console.log(
    '[Redirect] Redirecting user to frontend (status update will be handled by webhook)',
  );

  return { redirectUrl, statusUpdated: false };
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

  console.log('[Webhook] Processing webhook result...', {
    transactionId: transaction._id.toString(),
    gatewayTransactionId: webhookResult.transactionId,
    webhookResultSuccess: webhookResult.success,
    webhookResultStatus: webhookResult.status,
    currentTransactionStatus: transaction.status,
  });

  const { updateData, shouldTriggerSuccess } = prepareWebhookUpdateData(
    transaction,
    webhookResult,
    payload,
  );

  console.log('[Webhook] Prepared update data:', {
    shouldTriggerSuccess,
    updateDataKeys: Object.keys(updateData),
    updateDataStatus: updateData.status,
  });

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
    console.log('[Webhook] Transaction already processed or update failed', {
      transactionId: transaction._id.toString(),
      gatewayTransactionId: webhookResult.transactionId,
    });
    return;
  }

  console.log(
    '[Webhook] Transaction updated, checking if wallet update needed...',
    {
      transactionId: transaction._id.toString(),
      shouldTriggerSuccess,
      updateResultStatus: updateResult.status,
      webhookResultStatus: webhookResult.status,
    },
  );

  // Only trigger success if update was successful and status changed to success
  if (
    shouldTriggerSuccess &&
    updateResult &&
    updateResult.status === 'success'
  ) {
    console.log(
      '[Webhook] Triggering wallet update for successful payment...',
      {
        transactionId: transaction._id.toString(),
        gatewayTransactionId: webhookResult.transactionId,
        paymentMethod: paymentMethod.name,
      },
    );
    try {
      await updatePaymentTransactionStatus(
        transaction._id.toString(),
        'success',
        session,
      );
      console.log(
        '[Webhook] Successfully updated wallet and created credits transaction',
      );
    } catch (error) {
      console.error('[Webhook] Failed to update wallet:', {
        transactionId: transaction._id.toString(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  } else {
    console.log('[Webhook] Skipping wallet update:', {
      shouldTriggerSuccess,
      updateResultStatus: updateResult?.status,
      webhookResultStatus: webhookResult.status,
      transactionId: transaction._id.toString(),
    });
  }
};
