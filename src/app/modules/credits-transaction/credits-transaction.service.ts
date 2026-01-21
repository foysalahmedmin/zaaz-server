import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { clearUserWalletCache } from '../user-wallet/user-wallet.service';
import { CreditsTransaction } from './credits-transaction.model';
import { TCreditsTransaction } from './credits-transaction.type';

export const createCreditsTransaction = async (
  data: TCreditsTransaction,
  session?: mongoose.ClientSession,
): Promise<TCreditsTransaction> => {
  const result = await CreditsTransaction.create([data], { session });
  return result[0].toObject();
};

export const executeCreditsTransaction = async (
  data: TCreditsTransaction,
  session?: mongoose.ClientSession,
): Promise<TCreditsTransaction> => {
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

  // Update wallet based on transaction type
  if (data.type === 'increase') {
    await UserWallet.findByIdAndUpdate(
      data.user_wallet,
      { $inc: { credits: data.credits } },
      { session },
    );
  } else if (data.type === 'decrease') {
    // Check if user has enough credits
    if (wallet.credits < data.credits) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Insufficient credits in wallet',
      );
    }
    await UserWallet.findByIdAndUpdate(
      data.user_wallet,
      { $inc: { credits: -data.credits } },
      { session },
    );
  }

  const result = await CreditsTransaction.create([data], { session });

  // Clear wallet cache
  await clearUserWalletCache(wallet.user.toString());

  return result[0].toObject();
};

export const getCreditsTransactions = async (
  query: Record<string, unknown>,
  options: { isPublic?: boolean } = {},
): Promise<{
  data: TCreditsTransaction[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { user, email, user_wallet, type, ...rest } = query;

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

  if (type) {
    filter.type = type;
  }

  // Handle sensitive fields for public access
  if (options.isPublic) {
    const sensitiveFields = [
      'profit_credits',
      'cost_credits',
      'cost_price',
      'credit_price',
    ];

    if (rest.fields && typeof rest.fields === 'string') {
      // If specific fields requested, remove sensitive ones from the request
      const requestedFields = rest.fields.split(',');
      const safeFields = requestedFields.filter(
        (field) => !sensitiveFields.includes(field.trim()),
      );
      rest.fields = safeFields.join(',');
    } else {
      // If all fields requested (default), explicitly exclude sensitive ones
      rest.fields = sensitiveFields.map((f) => `-${f}`).join(',');
    }
  } else {
    // Admin access: Include sensitive fields if requested or default
    // We do NOT need to explicitly verify fields here as admins are trusted
    // But if we wanted to be explicit, we could add '+profit_credits' etc. here
    // However, the current AppAggregationQuery logic handles this based on user request.
    // The key is that `select: false` in model prevents auto-inclusion.
    // If admin explicitly wants these fields in the list, they must request them
    // via ?fields=profit_credits,cost_credits etc.
    // OR we change model default.
    // Given the requirement is "admin apis ghulo chara onno kothao jate oi fildes ghulo na chole jay",
    // relying on `select: false` is correct. Admin must explicitly select them.
  }

  const creditsTransactionQuery = new AppAggregationQuery<TCreditsTransaction>(
    CreditsTransaction,
    { ...rest, ...filter },
  );

  creditsTransactionQuery
    .populate([
      { path: 'user_wallet', select: '_id credits', justOne: true },
      {
        path: 'decrease_source',
        select: '_id name endpoint credits',
        justOne: true,
      },
      {
        path: 'payment_transaction',
        select: '_id status amount currency',
        justOne: true,
      },
      { path: 'plan', select: '_id name', justOne: true },
    ])
    .search(['email', 'usage_key'])
    .filter()
    .sort(['type', 'credits', 'created_at', 'updated_at'] as any)
    .paginate()
    .fields();

  const result = await creditsTransactionQuery.execute([
    {
      key: 'increase',
      filter: { type: 'increase' },
    },
    {
      key: 'decrease',
      filter: { type: 'decrease' },
    },
    {
      key: 'from_payment',
      filter: { type: 'increase', increase_source: 'payment' },
    },
    {
      key: 'from_bonus',
      filter: { type: 'increase', increase_source: 'bonus' },
    },
  ]);

  return result;
};

export const getCreditsTransaction = async (
  id: string,
): Promise<TCreditsTransaction> => {
  const result = await CreditsTransaction.findById(id)
    .select('+profit_credits +cost_credits +cost_price')
    .populate([
      { path: 'user_wallet', select: '_id credits' },
      { path: 'decrease_source', select: '_id name endpoint credits' },
      { path: 'payment_transaction', select: '_id status amount currency' },
    ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found');
  }
  return result;
};

export const deleteCreditsTransaction = async (id: string): Promise<void> => {
  const transaction = await CreditsTransaction.findById(id).lean();
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found');
  }

  // Reverse the transaction effect on wallet
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    if (transaction.type === 'increase') {
      wallet.credits = Math.max(0, wallet.credits - transaction.credits);
    } else {
      wallet.credits += transaction.credits;
    }
    await wallet.save();

    // Clear wallet cache
    await clearUserWalletCache(wallet.user.toString());
  }

  await CreditsTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteCreditsTransactionPermanent = async (
  id: string,
): Promise<void> => {
  const transaction = await CreditsTransaction.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found');
  }

  // Reverse the transaction effect on wallet before permanent delete
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    if (transaction.type === 'increase') {
      wallet.credits = Math.max(0, wallet.credits - transaction.credits);
    } else {
      wallet.credits += transaction.credits;
    }
    await wallet.save();

    // Clear wallet cache
    await clearUserWalletCache(wallet.user.toString());
  }

  await CreditsTransaction.findByIdAndDelete(id);
};

export const deleteCreditsTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await CreditsTransaction.find({
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
        wallet.credits = Math.max(0, wallet.credits - transaction.credits);
      } else {
        wallet.credits += transaction.credits;
      }
      await wallet.save();

      // Clear wallet cache
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await CreditsTransaction.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteCreditsTransactionsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const transactions = await CreditsTransaction.find({
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
        wallet.credits = Math.max(0, wallet.credits - transaction.credits);
      } else {
        wallet.credits += transaction.credits;
      }
      await wallet.save();

      // Clear wallet cache
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  await CreditsTransaction.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreCreditsTransaction = async (
  id: string,
): Promise<TCreditsTransaction> => {
  const transaction = await CreditsTransaction.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!transaction) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits transaction not found or not deleted',
    );
  }

  // Re-apply the transaction effect on wallet when restoring
  const wallet = await UserWallet.findById(transaction.user_wallet);
  if (wallet) {
    if (transaction.type === 'increase') {
      wallet.credits += transaction.credits;
    } else {
      wallet.credits = Math.max(0, wallet.credits - transaction.credits);
    }
    await wallet.save();

    // Clear wallet cache
    await clearUserWalletCache(wallet.user.toString());
  }

  return transaction;
};

export const restoreCreditsTransactions = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await CreditsTransaction.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredTransactions = await CreditsTransaction.find({
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
        wallet.credits += transaction.credits;
      } else {
        wallet.credits = Math.max(0, wallet.credits - transaction.credits);
      }
      await wallet.save();

      // Clear wallet cache
      await clearUserWalletCache(wallet.user.toString());
    }
  }

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
