import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { invalidateCache, withCache } from '../../utils/cache.utils';
import { CreditsTransaction } from '../credits-transaction/credits-transaction.model';
import { PackagePlan } from '../package-plan/package-plan.model';
import { getPackagePlansByPackage } from '../package-plan/package-plan.service';
import { PackageTransaction } from '../package-transaction/package-transaction.model';
import { Package } from '../package/package.model';
import { Plan } from '../plan/plan.model';
import * as UserWalletRepository from './user-wallet.repository';
import { TUserWallet } from './user-wallet.type';

const WALLET_CACHE_TTL = 43200; // 12 hours

export const clearUserWalletCache = async (userId: string) => {
  await invalidateCache(`user-wallet:${userId}`);
};

export const getFreshWallet = async (userId: string): Promise<TUserWallet | null> => {
  return await UserWalletRepository.findOne(
    { user: userId },
    undefined,
    { virtuals: true, select: 'credits package email expires_at' },
  );
};

export const createUserWallet = async (
  data: TUserWallet,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const existingWallet = await UserWalletRepository.findOne({ user: data.user }, session);
  if (existingWallet) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'User already has a wallet. Update existing wallet instead.',
    );
  }

  const walletData = { ...data, credits: data.credits || 0 };
  const result = await UserWalletRepository.create(walletData, session);
  await clearUserWalletCache(data.user.toString());
  return result;
};

export const getSelfUserWallet = async (
  userId: string,
  email?: string,
): Promise<TUserWallet | null> => {
  const result = await withCache(`user-wallet:${userId}`, WALLET_CACHE_TTL, async () => {
    return await UserWalletRepository.findOne({ user: userId });
  });

  if (result && !result.email && email) {
    await UserWalletRepository.updateOne({ _id: (result as any)._id }, { email });
    result.email = email;
    await clearUserWalletCache(userId);
  }

  return result;
};

export const getUserWallet = async (userId: string): Promise<TUserWallet | null> => {
  return withCache(`user-wallet:${userId}`, WALLET_CACHE_TTL, async () => {
    return await UserWalletRepository.findOne({ user: userId });
  });
};

export const getUserWalletById = async (id: string): Promise<TUserWallet> => {
  const result = await UserWalletRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }
  return result;
};

export const updateUserWallet = async (
  id: string,
  payload: Partial<Pick<TUserWallet, 'credits'>>,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const wallet = await UserWalletRepository.findById(id, session);
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  const result = await UserWalletRepository.findByIdAndUpdate(id, payload, session);
  if (result) await clearUserWalletCache(result.user.toString());
  return result!;
};

export const updateUserWalletByUser = async (
  userId: string,
  payload: Partial<Pick<TUserWallet, 'credits'>>,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const result = await UserWalletRepository.findOneAndUpdate({ user: userId }, payload, session);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }
  await clearUserWalletCache(userId);
  return result as any;
};

export const decrementWalletCredits = async (
  userId: string,
  credits: number,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const result = await UserWalletRepository.findOneAndUpdate(
    { user: userId },
    { $inc: { credits: -credits } },
    session,
  );
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }
  await clearUserWalletCache(userId);
  return (result as any).toObject ? (result as any).toObject() : result;
};

export const getUserWallets = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TUserWallet[]; meta: any }> => {
  const { user, package: packageId, plan, ...rest } = query_params;
  const filter: Record<string, unknown> = {};
  if (user) filter.user = new mongoose.Types.ObjectId(user as string);
  if (packageId) filter.package = new mongoose.Types.ObjectId(packageId as string);
  if (plan) filter.plan = new mongoose.Types.ObjectId(plan as string);

  return await UserWalletRepository.findPaginated(rest, filter, [{ key: 'all', filter: {} }]);
};

export const deleteUserWallet = async (id: string): Promise<void> => {
  const wallet = await UserWalletRepository.findById(id);
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }
  await UserWalletRepository.findByIdAndUpdate(id, { is_deleted: true });
  await clearUserWalletCache(wallet.user.toString());
};

export const deleteUserWalletPermanent = async (id: string): Promise<void> => {
  const wallet = await UserWalletRepository.findById(id, undefined, true);
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }
  await UserWalletRepository.UserWallet.findByIdAndDelete(id);
  await clearUserWalletCache(wallet.user.toString());
};

export const deleteUserWallets = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const wallets = await UserWalletRepository.findMany({ _id: { $in: ids } });
  const foundIds = wallets.map((wallet) => (wallet as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await UserWalletRepository.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  await Promise.all(wallets.map((wallet) => clearUserWalletCache(wallet.user.toString())));

  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteUserWalletsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const wallets = await UserWalletRepository.findMany({ _id: { $in: ids } });
  const foundIds = wallets.map((wallet) => (wallet as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await UserWalletRepository.deleteMany({ _id: { $in: foundIds } }, true);
  await Promise.all(wallets.map((wallet) => clearUserWalletCache(wallet.user.toString())));

  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restoreUserWallet = async (id: string): Promise<TUserWallet> => {
  const wallet = await UserWalletRepository.findOneAndRestore({ _id: id, is_deleted: true });
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found or not deleted');
  }
  await clearUserWalletCache(wallet.user.toString());
  return wallet;
};

export const restoreUserWallets = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await UserWalletRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
  });

  const restoredWallets = await UserWalletRepository.findMany({ _id: { $in: ids } });
  const restoredIds = new Set(restoredWallets.map((w) => (w as any)._id.toString()));
  const notFoundIds = ids.filter((id) => !restoredIds.has(id));

  await Promise.all(restoredWallets.map((w) => clearUserWalletCache(w.user.toString())));

  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const giveInitialCredits = async (
  user_id: string,
  credits?: number,
  session?: mongoose.ClientSession,
  email?: string,
): Promise<TUserWallet> => {
  const INITIAL_CREDITS = Number.parseInt(process.env.INITIAL_CREDITS || '100');
  const amount = credits || INITIAL_CREDITS;

  const existingWallet = await UserWalletRepository.findOne({ user: user_id }, session);
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email,
        credits: 0,
        initial_credits_given: false,
      },
      session,
    );
  }

  const updatedWallet = await UserWalletRepository.findOneAndUpdate(
    { user: user_id, initial_credits_given: { $ne: true } },
    { $inc: { credits: amount }, $set: { initial_credits_given: true } },
    session,
  );

  if (!updatedWallet) {
    const wallet = await UserWalletRepository.findOne({ user: user_id }, session);
    if (wallet?.initial_credits_given) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Initial credits has already been given to this user',
      );
    }
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await clearUserWalletCache(user_id);

  try {
    await CreditsTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: (updatedWallet as any)._id,
          email,
          type: 'increase',
          increase_source: 'bonus',
          credits: amount,
        },
      ],
      { session },
    );
  } catch (error) {
    console.error('[Give Initial Credits] Failed to create transaction:', error);
  }

  return (updatedWallet as any).toObject ? (updatedWallet as any).toObject() : updatedWallet;
};

export const giveBonusCredits = async (
  user_id: string,
  credits: number,
  session?: mongoose.ClientSession,
  email?: string,
): Promise<TUserWallet> => {
  if (credits <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Credits amount must be greater than 0');
  }

  const existingWallet = await UserWalletRepository.findOne({ user: user_id }, session);
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email,
        credits: 0,
        initial_credits_given: false,
      },
      session,
    );
  }

  const updatedWallet = await UserWalletRepository.findOneAndUpdate(
    { user: user_id },
    { $inc: { credits } },
    session,
  );

  if (!updatedWallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await clearUserWalletCache(user_id);

  try {
    await CreditsTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: (updatedWallet as any)._id,
          email,
          type: 'increase',
          increase_source: 'bonus',
          credits,
        },
      ],
      { session },
    );
  } catch (error) {
    console.error('[Give Bonus Credits] Failed to create transaction:', error);
  }

  return (updatedWallet as any).toObject ? (updatedWallet as any).toObject() : updatedWallet;
};

export const giveInitialPackage = async (
  user_id: string,
  is_verified?: boolean,
  session?: mongoose.ClientSession,
  email?: string,
): Promise<TUserWallet> => {
  if (!is_verified) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User is not verified');
  }

  const initialPackage = await Package.findOne({
    is_initial: true,
    is_active: true,
    is_deleted: { $ne: true },
  })
    .session(session || null)
    .lean();

  if (!initialPackage) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No initial package found. Please set a package as initial first.',
    );
  }

  const packagePlans = await getPackagePlansByPackage(initialPackage._id.toString(), false);
  const initialPlan = packagePlans.find((pp) => pp.is_initial === true);

  if (!initialPlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'No initial plan found for the initial package.');
  }

  const planData = await Plan.findById(initialPlan.plan).session(session || null).lean();
  if (!planData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  const existingWallet = await UserWalletRepository.findOne({ user: user_id }, session);
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email,
        credits: 0,
        initial_credits_given: false,
        initial_package_given: false,
      },
      session,
    );
  }

  return await assignPackage(
    {
      user_id,
      package_id: initialPackage._id.toString(),
      plan_id: planData._id.toString(),
      increase_source: 'bonus',
      email,
      is_initial: true,
    },
    session,
  );
};

export const assignPackage = async (
  data: {
    user_id: string;
    package_id: string;
    plan_id: string;
    increase_source: 'payment' | 'bonus';
    payment_transaction_id?: string;
    email?: string;
    is_initial?: boolean;
  },
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const { user_id, package_id, plan_id, increase_source, payment_transaction_id, email, is_initial } = data;

  if (payment_transaction_id) {
    const existingLog = await CreditsTransaction.findOne({
      payment_transaction: payment_transaction_id,
      type: 'increase',
      increase_source,
    })
      .session(session || null)
      .lean();

    if (existingLog) {
      const wallet = await UserWalletRepository.findOne({ user: user_id }, session);
      return wallet as TUserWallet;
    }
  }

  const packagePlan = await PackagePlan.findOne({
    package: package_id,
    plan: plan_id,
    is_active: true,
  })
    .session(session || null)
    .lean();

  if (!packagePlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package plan not found or not active');
  }

  const planData = await Plan.findById(plan_id).session(session || null).lean();
  if (!planData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  const existingWallet = await UserWalletRepository.findOne({ user: user_id }, session);
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email,
        credits: 0,
        initial_credits_given: false,
        initial_package_given: false,
      },
      session,
    );
  }

  const filter: any = { user: user_id };
  if (is_initial) filter.initial_package_given = { $ne: true };

  const updatedWallet = await UserWalletRepository.findOneAndUpdate(
    filter,
    {
      $inc: { credits: packagePlan.credits },
      $set: { ...(is_initial ? { initial_package_given: true } : {}) },
    },
    session,
  );

  const now = new Date();
  let expiresAt: Date;
  if (planData.duration && planData.duration > 0) {
    expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + (planData.duration as number));
  } else {
    expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);
  }

  const { Package: PackageModel } = await import('../package/package.model');
  const targetPackage = await PackageModel.findById(package_id).session(session || null).lean();
  let snapshotId = null;

  if (targetPackage) {
    const { PackageHistory } = await import('../package-history/package-history.model');
    const history = await PackageHistory.findOne({
      package: package_id,
      version: (targetPackage as any).version || 1,
    })
      .session(session || null)
      .sort({ created_at: -1 })
      .lean();
    snapshotId = history
      ? history._id
      : (await PackageHistory.findOne({ package: package_id })
          .session(session || null)
          .sort({ created_at: -1 })
          .lean())?._id || package_id;
  }

  const { createSubscription } = await import('../user-subscription/user-subscription.service');
  await createSubscription(
    {
      user: new mongoose.Types.ObjectId(user_id),
      package: new mongoose.Types.ObjectId(package_id),
      package_snapshot: snapshotId,
      plan: new mongoose.Types.ObjectId(plan_id),
      status: 'active',
      current_period_start: now,
      current_period_end: expiresAt,
      cancel_at_period_end: false,
      auto_renew: true,
    },
    session,
  );

  if (!updatedWallet) {
    if (is_initial) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Initial package has already been given or wallet not found',
      );
    }
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await clearUserWalletCache(user_id);

  try {
    const existingPackageTransaction = payment_transaction_id
      ? await PackageTransaction.findOne({
          payment_transaction: payment_transaction_id,
          increase_source,
        })
          .session(session || null)
          .lean()
      : null;

    if (!existingPackageTransaction) {
      await PackageTransaction.create(
        [
          {
            user: new mongoose.Types.ObjectId(user_id),
            user_wallet: (updatedWallet as any)._id,
            email: email || (updatedWallet as any).email,
            package: new mongoose.Types.ObjectId(package_id),
            plan: new mongoose.Types.ObjectId(plan_id),
            credits: packagePlan.credits,
            increase_source,
            payment_transaction: payment_transaction_id,
          },
        ],
        { session },
      );
    }
  } catch (error) {
    console.error('[Assign Package] Failed to create package transaction:', error);
  }

  try {
    const existingCreditsTransaction = payment_transaction_id
      ? await CreditsTransaction.findOne({
          payment_transaction: payment_transaction_id,
          type: 'increase',
          increase_source,
        })
          .session(session || null)
          .lean()
      : null;

    if (!existingCreditsTransaction) {
      await CreditsTransaction.create(
        [
          {
            user: new mongoose.Types.ObjectId(user_id),
            user_wallet: (updatedWallet as any)._id,
            email: email || (updatedWallet as any).email,
            type: 'increase',
            increase_source,
            credits: packagePlan.credits,
            plan: new mongoose.Types.ObjectId(plan_id),
            payment_transaction: payment_transaction_id,
          },
        ],
        { session },
      );
    }
  } catch (error) {
    console.error('[Assign Package] Failed to create credits transaction:', error);
  }

  return (updatedWallet as any).toObject();
};
