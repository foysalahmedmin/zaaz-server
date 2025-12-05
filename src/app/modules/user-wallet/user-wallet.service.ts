import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import AppQueryFind from '../../builder/app-query-find';
import { UserWallet } from './user-wallet.model';
import { TUserWallet } from './user-wallet.type';

export const createUserWallet = async (
  data: TUserWallet,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  // Check if user already has a wallet
  const existingWallet = await UserWallet.findOne({ user: data.user })
    .session(session || null)
    .lean();

  if (existingWallet) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'User already has a wallet. Update existing wallet instead.',
    );
  }

  // Get plan to calculate expires_at if duration exists (if plan is provided)
  let expiresAt: Date | undefined;
  if (data.plan) {
    const { Plan } = await import('../plan/plan.model');
    const planData = await Plan.findById(data.plan)
      .session(session || null)
      .lean();

    if (!planData) {
      throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
    }

    if (planData.duration) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + planData.duration);
    }
  }

  const walletData = {
    ...data,
    expires_at: expiresAt,
  };

  const result = await UserWallet.create([walletData], { session });
  return result[0].toObject();
};

export const getUserWallet = async (
  userId: string,
): Promise<TUserWallet | null> => {
  const result = await UserWallet.findOne({ user: userId })
    .populate('package')
    .lean();
  return result;
};

export const getUserWalletById = async (id: string): Promise<TUserWallet> => {
  const result = await UserWallet.findById(id).populate('package');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }
  return result;
};

export const updateUserWallet = async (
  id: string,
  payload: Partial<Pick<TUserWallet, 'token' | 'expires_at'>>,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const wallet = await UserWallet.findById(id)
    .session(session || null)
    .lean();

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  const updateData: any = { ...payload };
  if (payload.expires_at) {
    updateData.expires_at = new Date(payload.expires_at);
  }

  const result = await UserWallet.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).session(session || null);

  return result!;
};

export const updateUserWalletByUser = async (
  userId: string,
  payload: Partial<Pick<TUserWallet, 'token' | 'expires_at'>>,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const wallet = await UserWallet.findOne({ user: userId })
    .session(session || null)
    .lean();

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  const updateData: any = { ...payload };
  if (payload.expires_at) {
    updateData.expires_at = new Date(payload.expires_at);
  }

  const result = await UserWallet.findOneAndUpdate(
    { user: userId },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  ).session(session || null);

  return result!;
};

export const getUserWallets = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TUserWallet[]; meta: any }> => {
  const appQuery = new AppQueryFind(UserWallet, query_params)
    .populate('package')
    .search(['user'])
    .filter()
    .sort(['token', 'expires_at', 'created_at', 'updated_at'] as any)
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await appQuery.execute([
    {
      key: 'active',
      filter: {
        $or: [
          { expires_at: { $exists: false } },
          { expires_at: { $gte: new Date() } },
        ],
      },
    },
    {
      key: 'expired',
      filter: {
        expires_at: { $lt: new Date() },
      },
    },
  ]);

  return result;
};

export const deleteUserWallet = async (id: string): Promise<void> => {
  const wallet = await UserWallet.findById(id).lean();
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await UserWallet.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteUserWalletPermanent = async (id: string): Promise<void> => {
  const wallet = await UserWallet.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await UserWallet.findByIdAndDelete(id);
};

export const deleteUserWallets = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const wallets = await UserWallet.find({ _id: { $in: ids } }).lean();
  const foundIds = wallets.map((wallet) => wallet._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await UserWallet.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteUserWalletsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const wallets = await UserWallet.find({ _id: { $in: ids } }).lean();
  const foundIds = wallets.map((wallet) => wallet._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await UserWallet.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreUserWallet = async (id: string): Promise<TUserWallet> => {
  const wallet = await UserWallet.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!wallet) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'User wallet not found or not deleted',
    );
  }

  return wallet;
};

export const restoreUserWallets = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await UserWallet.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredWallets = await UserWallet.find({ _id: { $in: ids } }).lean();
  const restoredIds = new Set(
    restoredWallets.map((wallet) => wallet._id.toString()),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.has(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const giveInitialToken = async (
  user_id: string,
  token?: number,
  duration?: number,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const INITIAL_TOKEN = Number.parseInt(process.env.INITIAL_TOKEN || '100');
  const amount = token || INITIAL_TOKEN;

  // Calculate expires_at if duration is provided (duration in days)
  let expiresAt: Date | undefined;
  if (duration && duration > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);
  }

  // Check if wallet exists (bypass expired check for initial token)
  const existingWallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .setOptions({ bypassExpired: true })
    .lean();

  // If wallet doesn't exist, create it
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        token: 0,
        package: null,
        initial_token_given: false,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
      session,
    );
  }

  // Check if initial token already given using atomic operation
  const updatedWallet = await UserWallet.findOneAndUpdate(
    {
      user: user_id,
      initial_token_given: { $ne: true },
    },
    {
      $inc: { token: amount },
      $set: { initial_token_given: true },
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .session(session || null)
    .setOptions({ bypassExpired: true });

  if (!updatedWallet) {
    // Check if token was already given
    const existingWallet = await UserWallet.findOne({ user: user_id })
      .session(session || null)
      .setOptions({ bypassExpired: true })
      .lean();

    if (existingWallet?.initial_token_given) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Initial token has already been given to this user',
      );
    }

    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  // Create token transaction record for tracking
  try {
    const { TokenTransaction } = await import(
      '../token-transaction/token-transaction.model'
    );
    await TokenTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          type: 'increase',
          increase_source: 'bonus',
          token: amount,
        },
      ],
      { session },
    );
  } catch (error) {
    // Log error but don't block the operation
    console.error('[Give Initial Token] Failed to create transaction:', error);
  }

  return updatedWallet.toObject();
};

export const giveBonusToken = async (
  user_id: string,
  token: number,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  if (token <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Token amount must be greater than 0',
    );
  }

  // Check if wallet exists (bypass expired check for bonus token)
  const existingWallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .setOptions({ bypassExpired: true })
    .lean();

  // If wallet doesn't exist, create it
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        token: 0,
        package: null,
        initial_token_given: false,
      },
      session,
    );
  }

  // Update wallet: add bonus tokens
  const updatedWallet = await UserWallet.findOneAndUpdate(
    { user: user_id },
    {
      $inc: { token: token },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .session(session || null)
    .setOptions({ bypassExpired: true });

  if (!updatedWallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  // Create token transaction record for tracking
  try {
    const { TokenTransaction } = await import(
      '../token-transaction/token-transaction.model'
    );
    await TokenTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          type: 'increase',
          increase_source: 'bonus',
          token: token,
        },
      ],
      { session },
    );
  } catch (error) {
    // Log error but don't block the operation
    console.error('[Give Bonus Token] Failed to create transaction:', error);
  }

  return updatedWallet.toObject();
};
