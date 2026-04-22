import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { clearUserWalletCache } from '../user-wallet/user-wallet.service';
import * as PackageTransactionRepository from './package-transaction.repository';
import { TPackageTransaction } from './package-transaction.type';

export const createPackageTransaction = async (
  data: TPackageTransaction,
  session?: mongoose.ClientSession,
): Promise<TPackageTransaction> => {
  return await PackageTransactionRepository.create(data, session);
};

export const getPackageTransactions = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TPackageTransaction[]; meta: any }> => {
  const { user, package: packageId, interval, ...rest } = query_params;
  const filter: Record<string, unknown> = {};
  if (user) filter.user = new mongoose.Types.ObjectId(user as string);
  if (packageId) filter.package = new mongoose.Types.ObjectId(packageId as string);
  if (interval) filter.interval = new mongoose.Types.ObjectId(interval as string);

  return await PackageTransactionRepository.findPaginated(rest, filter, [
    { key: 'payment', filter: { increase_source: 'payment' } },
    { key: 'bonus', filter: { increase_source: 'bonus' } },
  ]);
};

export const getPackageTransactionById = async (
  id: string,
): Promise<TPackageTransaction | null> => {
  return await PackageTransactionRepository.findByIdPopulated(id);
};

export const deletePackageTransaction = async (id: string): Promise<void> => {
  const transaction = await PackageTransactionRepository.findById(id);
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package transaction not found');
  }

  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    wallet.credits = Math.max(0, wallet.credits - transaction.credits);
    await wallet.save();
    await clearUserWalletCache(wallet.user.toString());
  }

  await PackageTransactionRepository.softDeleteById(id);
};

export const deletePackageTransactionPermanent = async (id: string): Promise<void> => {
  const transaction = await PackageTransactionRepository.findById(id, true);
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package transaction not found');
  }

  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    wallet.credits = Math.max(0, wallet.credits - transaction.credits);
    await wallet.save();
    await clearUserWalletCache(wallet.user.toString());
  }

  await PackageTransactionRepository.permanentDeleteById(id);
};

export const deletePackageTransactions = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const transactions = await PackageTransactionRepository.findMany({ _id: { $in: ids } });
  const foundIds = transactions.map((t) => (t as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  for (const transaction of transactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      wallet.credits = Math.max(0, wallet.credits - transaction.credits);
      await wallet.save();
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await PackageTransactionRepository.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deletePackageTransactionsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const transactions = await PackageTransactionRepository.findMany({ _id: { $in: ids } });
  const foundIds = transactions.map((t) => (t as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  for (const transaction of transactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      wallet.credits = Math.max(0, wallet.credits - transaction.credits);
      await wallet.save();
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await PackageTransactionRepository.permanentDeleteMany({ _id: { $in: foundIds } });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restorePackageTransaction = async (id: string): Promise<TPackageTransaction> => {
  const transaction = await PackageTransactionRepository.findOneAndRestore({
    _id: id,
    is_deleted: true,
  });
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package transaction not found or not deleted');
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
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await PackageTransactionRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
  });

  const restoredTransactions = await PackageTransactionRepository.findMany({ _id: { $in: ids } });
  const restoredIds = restoredTransactions.map((t) => (t as any)._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  for (const transaction of restoredTransactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      wallet.credits += transaction.credits;
      await wallet.save();
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
