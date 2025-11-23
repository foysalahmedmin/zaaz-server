import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { TokenTransaction } from './token-transaction.model';
import { TTokenTransaction } from './token-transaction.type';

export const createTokenTransaction = async (
  data: TTokenTransaction,
  session?: mongoose.ClientSession,
): Promise<TTokenTransaction> => {
  // Validate user_wallet exists
  const wallet = await UserWallet.findById(data.user_wallet)
    .session(session || null)
    .lean();

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  // Update wallet based on transaction type
  if (data.type === 'increase') {
    await UserWallet.findByIdAndUpdate(
      data.user_wallet,
      { $inc: { token: data.token } },
      { session },
    );
  } else if (data.type === 'decrease') {
    // Check if user has enough tokens
    if (wallet.token < data.token) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Insufficient tokens in wallet',
      );
    }
    await UserWallet.findByIdAndUpdate(
      data.user_wallet,
      { $inc: { token: -data.token } },
      { session },
    );
  }

  const result = await TokenTransaction.create([data], { session });
  return result[0].toObject();
};

export const getTokenTransactions = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTokenTransaction[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { user, user_wallet, type, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (user) {
    filter.user = user;
  }

  if (user_wallet) {
    filter.user_wallet = user_wallet;
  }

  if (type) {
    filter.type = type;
  }

  const tokenTransactionQuery = new AppQuery<TTokenTransaction>(
    TokenTransaction.find().populate([
      { path: 'user_wallet', select: '_id token' },
      { path: 'decrease_source', select: '_id name endpoint token' },
      { path: 'payment_transaction', select: '_id status amount currency' },
    ]),
    { ...rest, ...filter },
  )
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await tokenTransactionQuery.execute();

  return result;
};

export const getTokenTransaction = async (
  id: string,
): Promise<TTokenTransaction> => {
  const result = await TokenTransaction.findById(id).populate([
    { path: 'user_wallet', select: '_id token' },
    { path: 'decrease_source', select: '_id name endpoint token' },
    { path: 'payment_transaction', select: '_id status amount currency' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token transaction not found');
  }
  return result;
};

export const deleteTokenTransaction = async (id: string): Promise<void> => {
  const transaction = await TokenTransaction.findById(id).lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token transaction not found');
  }

  // Reverse the transaction effect on wallet
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    if (transaction.type === 'increase') {
      wallet.token = Math.max(0, wallet.token - transaction.token);
    } else {
      wallet.token += transaction.token;
    }
    await wallet.save();
  }

  await TokenTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteTokenTransactionPermanent = async (
  id: string,
): Promise<void> => {
  const transaction = await TokenTransaction.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token transaction not found');
  }

  // Reverse the transaction effect on wallet before permanent delete
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    if (transaction.type === 'increase') {
      wallet.token = Math.max(0, wallet.token - transaction.token);
    } else {
      wallet.token += transaction.token;
    }
    await wallet.save();
  }

  await TokenTransaction.findByIdAndDelete(id);
};

export const deleteTokenTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await TokenTransaction.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = transactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  // Reverse wallet effects for all transactions
  for (const transaction of transactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      if (transaction.type === 'increase') {
        wallet.token = Math.max(0, wallet.token - transaction.token);
      } else {
        wallet.token += transaction.token;
      }
      await wallet.save();
    }
  }

  await TokenTransaction.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteTokenTransactionsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await TokenTransaction.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = transactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  // Reverse wallet effects for all transactions before permanent delete
  for (const transaction of transactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      if (transaction.type === 'increase') {
        wallet.token = Math.max(0, wallet.token - transaction.token);
      } else {
        wallet.token += transaction.token;
      }
      await wallet.save();
    }
  }

  await TokenTransaction.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreTokenTransaction = async (
  id: string,
): Promise<TTokenTransaction> => {
  const transaction = await TokenTransaction.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!transaction) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Token transaction not found or not deleted',
    );
  }

  // Re-apply the transaction effect on wallet when restoring
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    if (transaction.type === 'increase') {
      wallet.token += transaction.token;
    } else {
      wallet.token = Math.max(0, wallet.token - transaction.token);
    }
    await wallet.save();
  }

  return transaction;
};

export const restoreTokenTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await TokenTransaction.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredTransactions = await TokenTransaction.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredTransactions.map((transaction) =>
    transaction._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  // Re-apply wallet effects for all restored transactions
  for (const transaction of restoredTransactions) {
    const wallet = await UserWallet.findById(transaction.user_wallet);
    if (wallet) {
      if (transaction.type === 'increase') {
        wallet.token += transaction.token;
      } else {
        wallet.token = Math.max(0, wallet.token - transaction.token);
      }
      await wallet.save();
    }
  }

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
