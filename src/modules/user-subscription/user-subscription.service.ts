import mongoose from 'mongoose';
import { UserSubscription } from './user-subscription.model';
import { TUserSubscriptionDocument } from './user-subscription.type';

export const getActiveSubscription = async (
  userId: string,
): Promise<TUserSubscriptionDocument | null> => {
  const now = new Date();
  
  // Find an active subscription that hasn't expired
  const activeSubscription = await UserSubscription.findOne({
    user: userId,
    status: 'active',
    current_period_end: { $gt: now },
  }).populate({
    path: 'package_snapshot',
    model: 'PackageHistory',
    populate: {
      path: 'features',
    }
  }).lean();

  return activeSubscription as unknown as TUserSubscriptionDocument | null;
};

export const createSubscription = async (
  payload: any,
  session?: mongoose.ClientSession,
) => {
  // Inactivate previous active subscriptions for the user
  await UserSubscription.updateMany(
    { user: payload.user, status: 'active' },
    { $set: { status: 'canceled' } },
    { session }
  );

  const result = await UserSubscription.create([payload], { session });
  return result[0];
};
