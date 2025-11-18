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
      { $inc: { token: data.amount } },
      { session },
    );
  } else if (data.type === 'decrease') {
    // Check if user has enough tokens
    if (wallet.token < data.amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Insufficient tokens in wallet',
      );
    }
    await UserWallet.findByIdAndUpdate(
      data.user_wallet,
      { $inc: { token: -data.amount } },
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
      { path: 'payment_transaction', select: '_id status amount_usd' },
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
    { path: 'payment_transaction', select: '_id status amount_usd' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token transaction not found');
  }
  return result;
};

export const deleteTokenTransaction = async (
  id: string,
): Promise<void> => {
  const transaction = await TokenTransaction.findById(id).lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token transaction not found');
  }

  // Reverse the transaction effect on wallet
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    if (transaction.type === 'increase') {
      wallet.token = Math.max(0, wallet.token - transaction.amount);
    } else {
      wallet.token += transaction.amount;
    }
    await wallet.save();
  }

  await TokenTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

