import mongoose, { Document, Model, Types } from 'mongoose';

export type TTokenTransactionType = 'increase' | 'decrease';
export type TTokenTransactionIncreaseSource = 'payment' | 'bonus';
export type TTokenTransactionDecreaseSource = mongoose.Types.ObjectId; // FeatureEndpoint

export type TTokenTransaction = {
  user: mongoose.Types.ObjectId;
  user_wallet: mongoose.Types.ObjectId;
  type: TTokenTransactionType;
  token: number;
  increase_source?: TTokenTransactionIncreaseSource;
  decrease_source?: TTokenTransactionDecreaseSource;
  payment_transaction?: mongoose.Types.ObjectId;
  is_deleted?: boolean;
};

export interface TTokenTransactionDocument extends TTokenTransaction, Document {
  _id: Types.ObjectId;
}

export type TTokenTransactionModel = Model<TTokenTransactionDocument>;
