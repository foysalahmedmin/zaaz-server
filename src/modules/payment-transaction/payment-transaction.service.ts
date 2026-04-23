import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/app-aggregation-query';
import AppError from '../../builder/app-error';
import * as PaymentTransactionRepository from './payment-transaction.repository';
import { TPaymentTransaction } from './payment-transaction.type';

export const getPaymentTransactions = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPaymentTransaction[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { user, email, user_wallet, status, payment_method, ...rest } = query;

  const filter: Record<string, unknown> = {};
  if (user) filter.user = new mongoose.Types.ObjectId(user as string);
  if (user_wallet) filter.user_wallet = new mongoose.Types.ObjectId(user_wallet as string);
  if (email) filter.email = email;
  if (status) filter.status = status;
  if (payment_method)
    filter.payment_method = new mongoose.Types.ObjectId(payment_method as string);

  const payment_transaction_query = new AppAggregationQuery<TPaymentTransaction>(
    PaymentTransactionRepository.PaymentTransaction,
    { ...rest, ...filter },
  );

  payment_transaction_query
    .populate([
      { path: 'user_wallet', select: '_id credits', justOne: true },
      { path: 'payment_method', select: '_id name currencies', justOne: true },
      { path: 'package', select: '_id name', justOne: true },
      { path: 'interval', select: '_id name duration', justOne: true },
      { path: 'price', select: '_id price credits', justOne: true },
      { path: 'coupon', select: '_id code discount_type discount_value is_affiliate', justOne: true },
    ])
    .search(['email', 'customer_email', 'gateway_transaction_id'])
    .filter()
    .sort([
      'status', 'amount', 'currency', 'gateway_transaction_id', 'gateway_session_id',
      'paid_at', 'failed_at', 'refunded_at', 'customer_email', 'customer_name',
      'created_at', 'updated_at',
    ] as any)
    .paginate()
    .fields();

  return payment_transaction_query.execute([
    { key: 'success', filter: { status: 'success' } },
    { key: 'pending', filter: { status: 'pending' } },
    { key: 'failed', filter: { status: 'failed' } },
  ]);
};

export const getPaymentTransaction = async (
  id: string,
  user_id?: string,
): Promise<TPaymentTransaction> => {
  const result = await PaymentTransactionRepository.PaymentTransaction.findById(id)
    .populate([
      { path: 'user_wallet', select: '_id credits' },
      { path: 'payment_method', select: '_id name currencies' },
      { path: 'package', select: '_id name' },
      { path: 'interval', select: '_id name duration' },
      { path: 'price', select: '_id price credits' },
      { path: 'coupon', select: '_id code discount_type discount_value is_affiliate' },
    ])
    .lean();

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  if (user_id) {
    const tx_user_id = (result.user as mongoose.Types.ObjectId).toString();
    if (tx_user_id !== user_id.toString()) {
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
  user_id?: string,
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
  const transaction = await PaymentTransactionRepository.PaymentTransaction.findById(id)
    .select('status gateway_status amount currency user payment_method return_url cancel_url')
    .populate('payment_method', 'name')
    .lean();

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }

  if (user_id) {
    const tx_user_id = (transaction.user as mongoose.Types.ObjectId).toString();
    if (tx_user_id !== user_id.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You do not have permission to access this payment transaction',
      );
    }
  }

  let payment_method_id: string | undefined;
  let payment_method_name: string | undefined;

  if (transaction.payment_method) {
    if (
      typeof transaction.payment_method === 'object' &&
      '_id' in transaction.payment_method &&
      'name' in transaction.payment_method
    ) {
      const populated = transaction.payment_method as { _id: mongoose.Types.ObjectId; name: string };
      payment_method_id = populated._id.toString();
      payment_method_name = populated.name;
    } else if (transaction.payment_method instanceof mongoose.Types.ObjectId) {
      payment_method_id = transaction.payment_method.toString();
    } else if (typeof transaction.payment_method === 'object' && '_id' in transaction.payment_method) {
      payment_method_id = (transaction.payment_method as { _id: mongoose.Types.ObjectId })._id.toString();
    }
  }

  return {
    status: transaction.status,
    gateway_status: transaction.gateway_status,
    amount: transaction.amount,
    currency: transaction.currency,
    payment_method_id,
    payment_method_name,
    return_url: transaction.return_url,
    cancel_url: transaction.cancel_url,
  };
};

export const deletePaymentTransaction = async (id: string): Promise<void> => {
  await PaymentTransactionRepository.updateById(id, { is_deleted: true });
};

export const deletePaymentTransactionPermanent = async (id: string): Promise<void> => {
  const transaction = await PaymentTransactionRepository.PaymentTransaction.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found');
  }
  await PaymentTransactionRepository.PaymentTransaction.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });
};

export const deletePaymentTransactions = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const transactions = await PaymentTransactionRepository.findMany(ids);
  const found_ids = transactions.map((t: any) => t._id.toString());
  const not_found_ids = ids.filter((id) => !found_ids.includes(id));

  await PaymentTransactionRepository.PaymentTransaction.updateMany(
    { _id: { $in: found_ids } },
    { is_deleted: true },
  );

  return { count: found_ids.length, not_found_ids };
};

export const deletePaymentTransactionsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const transactions = await PaymentTransactionRepository.findMany(ids);
  const found_ids = transactions.map((t: any) => t._id.toString());
  const not_found_ids = ids.filter((id) => !found_ids.includes(id));

  await PaymentTransactionRepository.PaymentTransaction.deleteMany({
    _id: { $in: found_ids },
  }).setOptions({ bypassDeleted: true });

  return { count: found_ids.length, not_found_ids };
};

export const restorePaymentTransaction = async (
  id: string,
): Promise<TPaymentTransaction> => {
  const transaction = await PaymentTransactionRepository.PaymentTransaction.findOneAndUpdate(
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
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await PaymentTransactionRepository.PaymentTransaction.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restored = await PaymentTransactionRepository.findMany(ids);
  const restored_ids = restored.map((t: any) => t._id.toString());
  const not_found_ids = ids.filter((id) => !restored_ids.includes(id));

  return { count: result.modifiedCount, not_found_ids };
};
