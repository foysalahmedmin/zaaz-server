import mongoose, { Document, Model, Types } from 'mongoose';

export type TCreditsProfitHistory = {
  credits_profit: mongoose.Types.ObjectId;
  name: string;
  percentage: number;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TCreditsProfitHistoryDocument
  extends TCreditsProfitHistory, Document {
  _id: Types.ObjectId;
}

export type TCreditsProfitHistoryModel = Model<TCreditsProfitHistoryDocument>;
