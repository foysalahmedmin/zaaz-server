import mongoose, { Document, Model, Types } from 'mongoose';

export type TUserWallet = {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  email?: string;
  package?: mongoose.Types.ObjectId | null;
  plan?: mongoose.Types.ObjectId | null;
  credits: number;
  expires_at?: Date;
  initial_credits_given?: boolean;
  initial_package_given?: boolean;
  type: 'free' | 'paid';
  is_deleted?: boolean;
};

export interface TUserWalletDocument extends TUserWallet, Document {
  _id: Types.ObjectId;
}

export type TUserWalletModel = Model<TUserWalletDocument>;
