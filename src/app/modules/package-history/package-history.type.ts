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
  token: number;
  features: mongoose.Types.ObjectId[];
  duration: number;
  price: TPackagePrice;
  previous_price?: TPackagePrice;
  sequence?: number;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TPackageHistoryDocument extends TPackageHistory, Document {
  _id: Types.ObjectId;
}

export type TPackageHistoryModel = Model<TPackageHistoryDocument>;
