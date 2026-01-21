import mongoose, { Document, Model, Types } from 'mongoose';

export type TPackageTransaction = {
  user: mongoose.Types.ObjectId;
  email?: string;
  user_wallet: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  credits: number;
  increase_source: 'payment' | 'bonus';
  payment_transaction?: mongoose.Types.ObjectId;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TPackageTransactionDocument
  extends TPackageTransaction, Document {
  _id: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

export type TPackageTransactionModel = Model<TPackageTransactionDocument>;
