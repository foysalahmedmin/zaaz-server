import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import { Package } from '../package/package.model';
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

  // Get package to calculate expires_at if duration exists (if package is provided)
  let expiresAt: Date | undefined;
  if (data.package) {
    const packageData = await Package.findById(data.package)
      .session(session || null)
      .lean();

    if (!packageData) {
      throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
    }

    if (packageData.duration) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + packageData.duration);
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
  const AppQuery = (await import('../../builder/AppQuery')).default;
  const query = UserWallet.find().populate('package').populate('user');
  const appQuery = new AppQuery<TUserWallet>(query, query_params);

  appQuery
    .search(['user'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await appQuery.execute();

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
  const restoredIds = restoredWallets.map((wallet) => wallet._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
