import mongoose, { Document, Model, Types } from 'mongoose';

export type TUserWallet = {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  email?: string;
  credits: number;
  initial_credits_given?: boolean;
  initial_package_given?: boolean;
  is_deleted?: boolean;
};

export interface TUserWalletDocument extends TUserWallet, Document {
  _id: Types.ObjectId;
}

export type TUserWalletModel = Model<TUserWalletDocument>;


