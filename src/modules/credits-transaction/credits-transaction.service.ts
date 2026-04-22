import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { clearUserWalletCache } from '../user-wallet/user-wallet.service';
import * as CreditsTransactionRepository from './credits-transaction.repository';
import { TCreditsTransaction } from './credits-transaction.type';

export const createCreditsTransaction = async (
  data: TCreditsTransaction,
  session?: mongoose.ClientSession,
): Promise<TCreditsTransaction> => {
  return await CreditsTransactionRepository.create(data, session);
};

export const executeCreditsTransaction = async (
  data: TCreditsTransaction,
  session?: mongoose.ClientSession,
): Promise<TCreditsTransaction> => {
  const wallet = await CreditsTransactionRepository.findWalletById(
    data.user_wallet,
    session,
  );

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  if (!data.email && wallet.email) {
    data.email = wallet.email;
  }

  if (data.type === 'increase') {
    await CreditsTransactionRepository.updateWalletCredits(
      data.user_wallet,
      data.credits,
      session,
    );
  } else if (data.type === 'decrease') {
    if (wallet.credits < data.credits) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Insufficient credits in wallet');
    }
    await CreditsTransactionRepository.updateWalletCredits(
      data.user_wallet,
      -data.credits,
      session,
    );
  }

  const result = await CreditsTransactionRepository.create(data, session);
  await clearUserWalletCache(wallet.user.toString());
  return result;
};

export const getCreditsTransactions = async (
  query: Record<string, unknown>,
  options: { isPublic?: boolean } = {},
): Promise<{ data: TCreditsTransaction[]; meta: any }> => {
  const { user, email, user_wallet, type, ...rest } = query;

  const filter: Record<string, unknown> = {};
  if (user) filter.user = new mongoose.Types.ObjectId(user as string);
  if (user_wallet) filter.user_wallet = new mongoose.Types.ObjectId(user_wallet as string);
  if (email) filter.email = email;
  if (type) filter.type = type;

  const sensitiveFields = ['profit_credits', 'cost_credits', 'cost_price', 'credit_price'];
  let fieldOverrides: string | undefined;

  if (options.isPublic) {
    if (rest.fields && typeof rest.fields === 'string') {
      const requestedFields = rest.fields.split(',');
      const safeFields = requestedFields.filter(
        (f) => !sensitiveFields.includes(f.trim()),
      );
      rest.fields = safeFields.join(',');
    } else {
      fieldOverrides = sensitiveFields.map((f) => `-${f}`).join(',');
    }
  }

  return await CreditsTransactionRepository.findPaginated(rest, filter, fieldOverrides);
};

export const getCreditsTransaction = async (
  id: string,
): Promise<TCreditsTransaction> => {
  const result = await CreditsTransactionRepository.findById(id, true);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found');
  }
  return result;
};

export const deleteCreditsTransaction = async (id: string): Promise<void> => {
  const transaction = await CreditsTransactionRepository.findById(id);
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found');
  }

  const wallet = await CreditsTransactionRepository.findWalletById(
    transaction.user_wallet,
  );
  if (wallet) {
    wallet.credits =
      transaction.type === 'increase'
        ? Math.max(0, wallet.credits - transaction.credits)
        : wallet.credits + transaction.credits;
    await CreditsTransactionRepository.saveWallet(wallet);
    await clearUserWalletCache(wallet.user.toString());
  }

  await CreditsTransactionRepository.softDeleteById(id);
};

export const deleteCreditsTransactionPermanent = async (
  id: string,
): Promise<void> => {
  const transaction = await CreditsTransactionRepository.findById(id);
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found');
  }

  const wallet = await CreditsTransactionRepository.findWalletById(
    transaction.user_wallet,
  );
  if (wallet) {
    wallet.credits =
      transaction.type === 'increase'
        ? Math.max(0, wallet.credits - transaction.credits)
        : wallet.credits + transaction.credits;
    await CreditsTransactionRepository.saveWallet(wallet);
    await clearUserWalletCache(wallet.user.toString());
  }

  await CreditsTransactionRepository.permanentDeleteById(id);
};

export const deleteCreditsTransactions = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const transactions = await CreditsTransactionRepository.findByIds(ids);
  const foundIds = transactions.map((t) => (t as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  for (const t of transactions) {
    const wallet = await CreditsTransactionRepository.findWalletById(t.user_wallet);
    if (wallet) {
      wallet.credits =
        t.type === 'increase'
          ? Math.max(0, wallet.credits - t.credits)
          : wallet.credits + t.credits;
      await CreditsTransactionRepository.saveWallet(wallet);
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await CreditsTransactionRepository.softDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const deleteCreditsTransactionsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const transactions = await CreditsTransactionRepository.findByIds(ids);
  const foundIds = transactions.map((t) => (t as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  for (const t of transactions) {
    const wallet = await CreditsTransactionRepository.findWalletById(t.user_wallet);
    if (wallet) {
      wallet.credits =
        t.type === 'increase'
          ? Math.max(0, wallet.credits - t.credits)
          : wallet.credits + t.credits;
      await CreditsTransactionRepository.saveWallet(wallet);
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await CreditsTransactionRepository.permanentDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const restoreCreditsTransaction = async (
  id: string,
): Promise<TCreditsTransaction> => {
  const transaction = await CreditsTransactionRepository.restore(id);
  if (!transaction) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits transaction not found or not deleted',
    );
  }

  const wallet = await CreditsTransactionRepository.findWalletById(
    transaction.user_wallet,
  );
  if (wallet) {
    wallet.credits =
      transaction.type === 'increase'
        ? wallet.credits + transaction.credits
        : Math.max(0, wallet.credits - transaction.credits);
    await CreditsTransactionRepository.saveWallet(wallet);
    await clearUserWalletCache(wallet.user.toString());
  }

  return transaction;
};

export const restoreCreditsTransactions = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await CreditsTransactionRepository.restoreMany(ids);

  const restored = await CreditsTransactionRepository.findByIds(ids);
  const restoredIds = restored.map((t) => (t as any)._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  for (const t of restored) {
    const wallet = await CreditsTransactionRepository.findWalletById(t.user_wallet);
    if (wallet) {
      wallet.credits =
        t.type === 'increase'
          ? wallet.credits + t.credits
          : Math.max(0, wallet.credits - t.credits);
      await CreditsTransactionRepository.saveWallet(wallet);
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  return { count: result.modifiedCount, not_found_ids };
};
