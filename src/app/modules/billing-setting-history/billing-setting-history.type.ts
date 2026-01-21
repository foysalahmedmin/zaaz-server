import mongoose, { Document, Model, Types } from 'mongoose';

export type TBillingSettingHistory = {
  billing_setting: mongoose.Types.ObjectId;
  credit_price: number;
  currency: 'USD';
  status: 'active' | 'inactive';
  applied_at: Date;
  is_active: boolean;
  is_initial: boolean;
  is_deleted?: boolean;
};

export interface TBillingSettingHistoryDocument
  extends TBillingSettingHistory, Document {
  _id: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

export type TBillingSettingHistoryModel = Model<TBillingSettingHistoryDocument>;
