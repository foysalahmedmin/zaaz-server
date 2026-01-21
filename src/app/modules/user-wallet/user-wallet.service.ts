import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { invalidateCache, withCache } from '../../utils/cache.utils';
import { CreditsTransaction } from '../credits-transaction/credits-transaction.model';
import { PackagePlan } from '../package-plan/package-plan.model';
import { getPackagePlansByPackage } from '../package-plan/package-plan.service';
import { PackageTransaction } from '../package-transaction/package-transaction.model';
import { Package } from '../package/package.model';
import { Plan } from '../plan/plan.model';
import { UserWallet } from './user-wallet.model';
import { TUserWallet } from './user-wallet.type';

const WALLET_CACHE_TTL = 43200; // 12 hours (Optimized for production with proper invalidation)

export const clearUserWalletCache = async (userId: string) => {
  await invalidateCache(`user-wallet:${userId}`);
};

export const getFreshWallet = async (
  userId: string,
): Promise<TUserWallet | null> => {
  return await UserWallet.findOne({ user: userId })
    .select('credits package email')
    .lean();
};

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

  // Clear cache for safety (though it shouldn't exist)
  await clearUserWalletCache(data.user.toString());

  return result[0].toObject();
};

export const getSelfUserWallet = async (
  userId: string,
  email?: string,
): Promise<TUserWallet | null> => {
  const result = await withCache(
    `user-wallet:${userId}`,
    WALLET_CACHE_TTL,
    async () => {
      const wallet = await UserWallet.findOne({ user: userId })
        .populate({
          path: 'package',
          populate: {
            path: 'features',
            select: '_id name description type max_word',
            populate: {
              path: 'feature_endpoints',
            },
          },
        })
        .populate({
          path: 'plan',
          select: '_id name duration',
        })
        .lean();
      return wallet;
    },
  );

  // If email is missing in the wallet, update it with the provided email
  if (result && !result.email && email) {
    await UserWallet.updateOne({ _id: (result as any)._id }, { email });
    result.email = email;
    // Clear cache to ensure next retrieval has the email
    await clearUserWalletCache(userId);
  }

  return result;
};

export const getUserWallet = async (
  userId: string,
): Promise<TUserWallet | null> => {
  return withCache(`user-wallet:${userId}`, WALLET_CACHE_TTL, async () => {
    const result = await UserWallet.findOne({ user: userId })
      .populate({
        path: 'package',
        populate: {
          path: 'features',
          select: '_id name description type max_word',
          populate: {
            path: 'feature_endpoints',
          },
        },
      })
      .populate({
        path: 'plan',
        select: '_id name duration',
      })
      .lean();
    return result;
  });
};

export const getUserWalletById = async (id: string): Promise<TUserWallet> => {
  const result = await UserWallet.findById(id).populate(['package', 'plan']);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }
  return result;
};

export const updateUserWallet = async (
  id: string,
  payload: Partial<Pick<TUserWallet, 'credits' | 'expires_at'>>,
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

  if (result) {
    await clearUserWalletCache(result.user.toString());
  }

  return result!;
};

export const updateUserWalletByUser = async (
  userId: string,
  payload: Partial<Pick<TUserWallet, 'credits' | 'expires_at'>>,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
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

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await clearUserWalletCache(userId);

  return result;
};

export const decrementWalletCredits = async (
  userId: string,
  credits: number,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const result = await UserWallet.findOneAndUpdate(
    { user: userId },
    { $inc: { credits: -credits } },
    {
      new: true,
      runValidators: true,
      session,
    },
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await clearUserWalletCache(userId);

  return result.toObject();
};

export const getUserWallets = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TUserWallet[]; meta: any }> => {
  const { user, package: packageId, plan, ...rest } = query_params;
  const filter: Record<string, unknown> = {};

  if (user) filter.user = new mongoose.Types.ObjectId(user as string);
  if (packageId)
    filter.package = new mongoose.Types.ObjectId(packageId as string);
  if (plan) filter.plan = new mongoose.Types.ObjectId(plan as string);

  const appQuery = new AppAggregationQuery<TUserWallet>(UserWallet, {
    ...rest,
    ...filter,
  });

  appQuery
    .populate([
      { path: 'package', justOne: true },
      { path: 'plan', justOne: true },
    ])
    .search(['email'])
    .filter()
    .sort(['credits', 'expires_at', 'created_at', 'updated_at'] as any)
    .paginate()
    .fields();

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
    {
      key: 'free',
      filter: { type: 'free' },
    },
    {
      key: 'paid',
      filter: { type: 'paid' },
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

  await clearUserWalletCache(wallet.user.toString());
};

export const deleteUserWalletPermanent = async (id: string): Promise<void> => {
  const wallet = await UserWallet.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  await UserWallet.findByIdAndDelete(id);

  await clearUserWalletCache(wallet.user.toString());
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

  // Clear cache for all found wallets
  await Promise.all(
    wallets.map((wallet) => clearUserWalletCache(wallet.user.toString())),
  );

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

  // Clear cache for all found wallets
  await Promise.all(
    wallets.map((wallet) => clearUserWalletCache(wallet.user.toString())),
  );

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

  await clearUserWalletCache(wallet.user.toString());

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

  // Clear cache for all restored wallets
  await Promise.all(
    restoredWallets.map((wallet) =>
      clearUserWalletCache(wallet.user.toString()),
    ),
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const giveInitialCredits = async (
  user_id: string,
  credits?: number,
  duration?: number,
  session?: mongoose.ClientSession,
  email?: string,
): Promise<TUserWallet> => {
  const INITIAL_CREDITS = Number.parseInt(process.env.INITIAL_CREDITS || '100');
  const amount = credits || INITIAL_CREDITS;

  // Calculate expires_at if duration is provided (duration in days)
  let expiresAt: Date | undefined;
  if (duration && duration > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);
  }

  // Check if wallet exists (bypass expired check for initial credits)
  const existingWallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .setOptions({ bypassExpired: true })
    .lean();

  // If wallet doesn't exist, create it
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email: email,
        credits: 0,
        package: null,
        initial_credits_given: false,
        type: 'free',
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
      session,
    );
  }

  // Check if initial credits already given using atomic operation
  const updatedWallet = await UserWallet.findOneAndUpdate(
    {
      user: user_id,
      initial_credits_given: { $ne: true },
    },
    {
      $inc: { credits: amount },
      $set: { initial_credits_given: true },
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
    // Check if credits was already given
    const existingWallet = await UserWallet.findOne({ user: user_id })
      .session(session || null)
      .setOptions({ bypassExpired: true })
      .lean();

    if (existingWallet?.initial_credits_given) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Initial credits has already been given to this user',
      );
    }

    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  // Clear cache after update
  await clearUserWalletCache(user_id);

  // Create credits transaction record for tracking
  try {
    await CreditsTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          email: email,
          type: 'increase',
          increase_source: 'bonus',
          credits: amount,
        },
      ],
      { session },
    );
  } catch (error) {
    // Log error but don't block the operation
    console.error(
      '[Give Initial Credits] Failed to create transaction:',
      error,
    );
  }

  return updatedWallet.toObject();
};

export const giveBonusCredits = async (
  user_id: string,
  credits: number,
  session?: mongoose.ClientSession,
  email?: string,
): Promise<TUserWallet> => {
  if (credits <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Credits amount must be greater than 0',
    );
  }

  // Check if wallet exists (bypass expired check for bonus credits)
  const existingWallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .setOptions({ bypassExpired: true })
    .lean();

  // If wallet doesn't exist, create it
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email: email,
        credits: 0,
        package: null,
        initial_credits_given: false,
        type: 'free',
      },
      session,
    );
  }

  // Update wallet: add bonus credits
  const updatedWallet = await UserWallet.findOneAndUpdate(
    { user: user_id },
    {
      $inc: { credits: credits },
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

  // Clear cache after update
  await clearUserWalletCache(user_id);

  // Create credits transaction record for tracking
  try {
    await CreditsTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          email: email,
          type: 'increase',
          increase_source: 'bonus',
          credits: credits,
        },
      ],
      { session },
    );
  } catch (error) {
    // Log error but don't block the operation
    console.error('[Give Bonus Credits] Failed to create transaction:', error);
  }

  return updatedWallet.toObject();
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

  // Find the initial package
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

  // Get the initial plan for this package
  const packagePlans = await getPackagePlansByPackage(
    initialPackage._id.toString(),
    false,
  );

  const initialPlan = packagePlans.find((pp) => pp.is_initial === true);

  if (!initialPlan) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No initial plan found for the initial package.',
    );
  }

  // Get plan details
  const planData = await Plan.findById(initialPlan.plan)
    .session(session || null)
    .lean();

  if (!planData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  // Calculate expires_at if plan has duration
  let expiresAt: Date | undefined;
  if (planData.duration && planData.duration > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planData.duration);
  }

  // Check if wallet exists (bypass expired check for initial package)
  const existingWallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .setOptions({ bypassExpired: true })
    .lean();

  // If wallet doesn't exist, create it
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email: email,
        credits: 0,
        package: null,
        plan: null,
        initial_credits_given: false,
        initial_package_given: false,
        type: 'free',
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
      session,
    );
  }

  // Check if initial package already given using atomic operation
  const updatedWallet = await UserWallet.findOneAndUpdate(
    {
      user: user_id,
      initial_package_given: { $ne: true },
    },
    {
      $inc: { credits: initialPlan.credits },
      $set: {
        package: initialPackage._id,
        plan: planData._id,
        initial_package_given: true,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .session(session || null)
    .setOptions({ bypassExpired: true });

  if (!updatedWallet) {
    // Check if package was already given
    const existingWallet = await UserWallet.findOne({ user: user_id })
      .session(session || null)
      .setOptions({ bypassExpired: true })
      .lean();

    if (existingWallet?.initial_package_given) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Initial package has already been given to this user',
      );
    }

    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  // Clear cache after update
  await clearUserWalletCache(user_id);

  // Create package transaction record for tracking
  try {
    await PackageTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          email: email || updatedWallet.email,
          package: initialPackage._id,
          plan: planData._id,
          credits: initialPlan.credits,
          increase_source: 'bonus',
        },
      ],
      { session },
    );
  } catch (error) {
    console.error(
      '[Give Initial Package] Failed to create package transaction:',
      error,
    );
  }

  // Create credits transaction record for tracking
  try {
    await CreditsTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          email: email || updatedWallet.email,
          type: 'increase',
          increase_source: 'bonus',
          credits: initialPlan.credits,
          plan: planData._id,
        },
      ],
      { session },
    );
  } catch (error) {
    // Log error but don't block the operation
    console.error(
      '[Give Initial Package] Failed to create transaction:',
      error,
    );
  }

  return updatedWallet.toObject();
};
export const assignPackage = async (
  user_id: string,
  package_id: string,
  plan_id: string,
  increase_source: 'payment' | 'bonus',
  session?: mongoose.ClientSession,
  email?: string,
): Promise<TUserWallet> => {
  // Find the package plan
  const packagePlan = await PackagePlan.findOne({
    package: package_id,
    plan: plan_id,
    is_active: true,
  })
    .session(session || null)
    .lean();

  if (!packagePlan) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package plan not found or not active',
    );
  }

  // Get plan details
  const planData = await Plan.findById(plan_id)
    .session(session || null)
    .lean();

  if (!planData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  // Calculate expires_at if plan has duration
  let expiresAt: Date | undefined;
  if (planData.duration && planData.duration > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planData.duration);
  }

  // Check if wallet exists
  const existingWallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .setOptions({ bypassExpired: true })
    .lean();

  // If wallet doesn't exist, create it
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        email: email,
        credits: 0,
        package: null,
        plan: null,
        initial_credits_given: false,
        initial_package_given: false,
        type: 'free',
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
      session,
    );
  }

  // Update wallet: add credits and set package/plan
  const updatedWallet = await UserWallet.findOneAndUpdate(
    { user: user_id },
    {
      $inc: { credits: packagePlan.credits },
      $set: {
        package: package_id,
        plan: plan_id,
        type: 'paid', // Mark as paid if a package is assigned (usually)
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
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

  // Clear cache after update
  await clearUserWalletCache(user_id);

  // Create package transaction record for tracking
  try {
    await PackageTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          email: email || updatedWallet.email,
          package: new mongoose.Types.ObjectId(package_id),
          plan: new mongoose.Types.ObjectId(plan_id),
          credits: packagePlan.credits,
          increase_source,
        },
      ],
      { session },
    );
  } catch (error) {
    console.error(
      '[Assign Package] Failed to create package transaction:',
      error,
    );
  }

  // Create credits transaction record for tracking
  try {
    await CreditsTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          email: email || updatedWallet.email,
          type: 'increase',
          increase_source,
          credits: packagePlan.credits,
          plan: new mongoose.Types.ObjectId(plan_id),
        },
      ],
      { session },
    );
  } catch (error) {
    console.error(
      '[Assign Package] Failed to create credits transaction:',
      error,
    );
  }

  return updatedWallet.toObject();
};
