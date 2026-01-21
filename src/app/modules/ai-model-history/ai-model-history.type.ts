import mongoose, { Document, Model, Types } from 'mongoose';

export type TAiModelHistory = {
  ai_model: mongoose.Types.ObjectId;
  name: string;
  value: string;
  provider: string;
  input_token_price: number;
  output_token_price: number;
  currency: 'USD';
  is_active?: boolean;
  is_initial?: boolean;
  is_deleted?: boolean;
};

export interface TAiModelHistoryDocument extends TAiModelHistory, Document {
  _id: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

export type TAiModelHistoryModel = Model<TAiModelHistoryDocument>;
