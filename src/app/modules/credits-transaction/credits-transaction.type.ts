import mongoose, { Document, Model, Types } from 'mongoose';

export type TCreditsTransactionType = 'increase' | 'decrease';
export type TCreditsTransactionIncreaseSource = 'payment' | 'bonus';
export type TCreditsTransactionDecreaseSource = mongoose.Types.ObjectId; // FeatureEndpoint

export type TCreditsTransaction = {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  email?: string;
  user_wallet: mongoose.Types.ObjectId;
  type: TCreditsTransactionType;
  credits: number;
  increase_source?: TCreditsTransactionIncreaseSource;
  decrease_source?: TCreditsTransactionDecreaseSource;
  payment_transaction?: mongoose.Types.ObjectId;
  plan?: mongoose.Types.ObjectId;
  usage_key?: string;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TCreditsTransactionDocument
  extends TCreditsTransaction, Document {
  _id: Types.ObjectId;
}

export type TCreditsTransactionModel = Model<TCreditsTransactionDocument>;
