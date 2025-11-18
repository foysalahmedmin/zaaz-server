import mongoose, { Document, Model, Types } from 'mongoose';

export type TTokenProfitHistory = {
  token_profit: mongoose.Types.ObjectId;
  name: string;
  percentage: number;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TTokenProfitHistoryDocument
  extends TTokenProfitHistory,
    Document {
  _id: Types.ObjectId;
}

export type TTokenProfitHistoryModel = Model<TTokenProfitHistoryDocument>;

