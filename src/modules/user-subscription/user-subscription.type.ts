import mongoose, { Document, Model, Types } from 'mongoose';

export type TUserSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export type TUserSubscription = {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId | null;
  package_snapshot: mongoose.Types.ObjectId | null;
  interval: mongoose.Types.ObjectId | null;
  status: TUserSubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  auto_renew: boolean;
  is_deleted?: boolean;
};

export interface TUserSubscriptionDocument extends TUserSubscription, Document {
  _id: Types.ObjectId;
}

export type TUserSubscriptionModel = Model<TUserSubscriptionDocument>;
