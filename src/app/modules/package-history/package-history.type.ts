import mongoose, { Document, Model, Types } from 'mongoose';

export type TPackageHistory = {
  package: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  content?: string;
  token: number;
  features: mongoose.Types.ObjectId[];
  duration: number;
  price: number;
  previous_price: number;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TPackageHistoryDocument
  extends TPackageHistory,
    Document {
  _id: Types.ObjectId;
}

export type TPackageHistoryModel = Model<TPackageHistoryDocument>;

