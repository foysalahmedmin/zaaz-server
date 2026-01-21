import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { clearUserWalletCache } from '../user-wallet/user-wallet.service';
import { PackageTransaction } from './package-transaction.model';
import { TPackageTransaction } from './package-transaction.type';

export const createPackageTransaction = async (
  data: TPackageTransaction,
  session?: mongoose.ClientSession,
): Promise<TPackageTransaction> => {
  const result = await PackageTransaction.create([data], { session });
  return result[0].toObject();
};

export const getPackageTransactions = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TPackageTransaction[]; meta: any }> => {
  const { user, package: packageId, plan, ...rest } = query_params;
  const filter: Record<string, unknown> = {};

  if (user) filter.user = new mongoose.Types.ObjectId(user as string);
  if (packageId)
    filter.package = new mongoose.Types.ObjectId(packageId as string);
  if (plan) filter.plan = new mongoose.Types.ObjectId(plan as string);

  const appQuery = new AppAggregationQuery<TPackageTransaction>(
    PackageTransaction,
    {
      ...rest,
      ...filter,
    },
  );

  appQuery
    .populate([
      { path: 'package', justOne: true },
      { path: 'plan', justOne: true },
      { path: 'user', select: 'name email', justOne: true },
    ])
    .search(['email'])
    .filter()
    .sort(['created_at', 'updated_at'] as any)
    .paginate()
    .fields();

  const result = await appQuery.execute([
    {
      key: 'payment',
      filter: { increase_source: 'payment' },
    },
    {
      key: 'bonus',
      filter: { increase_source: 'bonus' },
    },
  ]);

  return result;
};

export const getPackageTransactionById = async (
  id: string,
): Promise<TPackageTransaction | null> => {
  return await PackageTransaction.findById(id).populate([
    'package',
    'plan',
    'user',
    'user_wallet',
    'payment_transaction',
  ]);
};

export const deletePackageTransaction = async (id: string): Promise<void> => {
  const transaction = await PackageTransaction.findById(id).lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package transaction not found');
  }

  // Reverse the transaction effect on wallet (subtract credits if it was an increase)
  // Since PackageTransactions are currently only increases (payment or bonus)
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    wallet.credits = Math.max(0, wallet.credits - transaction.credits);
    await wallet.save();
    await clearUserWalletCache(wallet.user.toString());
  }

  await PackageTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

export const deletePackageTransactionPermanent = async (
  id: string,
): Promise<void> => {
  const transaction = await PackageTransaction.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package transaction not found');
  }

  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    wallet.credits = Math.max(0, wallet.credits - transaction.credits);
    await wallet.save();
    await clearUserWalletCache(wallet.user.toString());
  }

  await PackageTransaction.findByIdAndDelete(id);
};

export const deletePackageTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await PackageTransaction.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = transactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  for (const transaction of transactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      wallet.credits = Math.max(0, wallet.credits - transaction.credits);
      await wallet.save();
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await PackageTransaction.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePackageTransactionsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await PackageTransaction.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = transactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  for (const transaction of transactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      wallet.credits = Math.max(0, wallet.credits - transaction.credits);
      await wallet.save();
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await PackageTransaction.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePackageTransaction = async (
  id: string,
): Promise<TPackageTransaction> => {
  const transaction = await PackageTransaction.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!transaction) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package transaction not found or not deleted',
    );
  }

  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    wallet.credits += transaction.credits;
    await wallet.save();
    await clearUserWalletCache(wallet.user.toString());
  }

  return transaction as TPackageTransaction;
};

export const restorePackageTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await PackageTransaction.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredTransactions = await PackageTransaction.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredTransactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  for (const transaction of restoredTransactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      wallet.credits += transaction.credits;
      await wallet.save();
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
