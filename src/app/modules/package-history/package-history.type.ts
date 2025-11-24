import mongoose, { Document, Model, Types } from 'mongoose';

export type TPackagePrice = {
  USD: number;
  BDT: number;
};

export type TPackageHistory = {
  package: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  content?: string;
  features: mongoose.Types.ObjectId[];
  plans: mongoose.Types.ObjectId[];
  sequence?: number;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TPackageHistoryDocument extends TPackageHistory, Document {
  _id: Types.ObjectId;
}

export type TPackageHistoryModel = Model<TPackageHistoryDocument>;
