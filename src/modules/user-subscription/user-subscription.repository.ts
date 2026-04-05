/**
 * User Subscription Repository
 *
 * Handles direct database interactions for the User Subscription module.
 */

import { UserSubscription } from './user-subscription.model';
import { TUserSubscriptionDocument } from './user-subscription.type';
import mongoose from 'mongoose';

export { UserSubscription };

/**
 * Find an active subscription for a user.
 */
export const findActiveSubscription = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<TUserSubscriptionDocument | null> => {
  const now = new Date();

  const activeSubscription = await UserSubscription.findOne({
    user: userId,
    status: 'active',
    current_period_end: { $gt: now },
  })
    .populate({
      path: 'package_snapshot',
      model: 'PackageHistory',
      populate: {
        path: 'features',
      },
    })
    .lean();

  return activeSubscription as unknown as TUserSubscriptionDocument | null;
};

/**
 * Update many user subscriptions' status.
 */
export const updateManyStatuses = async (
  userId: string | mongoose.Types.ObjectId,
  currentStatus: string,
  newStatus: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await UserSubscription.updateMany(
    { user: userId, status: currentStatus },
    { $set: { status: newStatus } },
    { session },
  );
};

/**
 * Create a new user subscription.
 */
export const create = async (
  payload: any,
  session?: mongoose.ClientSession,
): Promise<any> => {
  const result = await UserSubscription.create([payload], { session });
  return result[0];
};
