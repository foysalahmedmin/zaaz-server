import mongoose from 'mongoose';
import * as UserSubscriptionRepository from './user-subscription.repository';
import { TUserSubscriptionDocument } from './user-subscription.type';

export const getActiveSubscription = async (
  userId: string,
): Promise<TUserSubscriptionDocument | null> => {
  return await UserSubscriptionRepository.findActiveSubscription(userId);
};

export const createSubscription = async (
  payload: any,
  session?: mongoose.ClientSession,
) => {
  // Inactivate previous active subscriptions for the user
  await UserSubscriptionRepository.updateManyStatuses(
    payload.user,
    'active',
    'canceled',
    session
  );

  return await UserSubscriptionRepository.create(payload, session);
};
