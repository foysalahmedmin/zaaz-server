import mongoose, { Document, Model, Types } from 'mongoose';

export type TUserWallet = {
  user: mongoose.Types.ObjectId;
  package?: mongoose.Types.ObjectId | null;
  token: number;
  expires_at?: Date;
  is_deleted?: boolean;
};

export interface TUserWalletDocument extends TUserWallet, Document {
  _id: Types.ObjectId;
}

export type TUserWalletModel = Model<TUserWalletDocument>;
