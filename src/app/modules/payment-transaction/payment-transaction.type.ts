import mongoose, { Document, Model, Types } from 'mongoose';

export type TPaymentTransactionStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'refunded';

export type TPaymentTransaction = {
  user: mongoose.Types.ObjectId;
  user_wallet: mongoose.Types.ObjectId;
  status: TPaymentTransactionStatus;
  payment_method: mongoose.Types.ObjectId;
  gateway_transaction_id: string;
  package: mongoose.Types.ObjectId;
  amount_usd: number;
  amount_bdt: number;
  exchange_rate?: number;
  is_deleted?: boolean;
};

export interface TPaymentTransactionDocument
  extends TPaymentTransaction,
    Document {
  _id: Types.ObjectId;
}

export type TPaymentTransactionModel = Model<TPaymentTransactionDocument>;

