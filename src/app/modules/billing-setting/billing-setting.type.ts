import { Document, Model, Types } from 'mongoose';

export type TBillingSetting = {
  credit_price: number;
  currency: 'USD';
  status: 'active' | 'inactive';
  applied_at: Date;
  is_active: boolean;
  is_initial: boolean;
  is_deleted?: boolean;
};

export interface TBillingSettingDocument extends TBillingSetting, Document {
  _id: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

export type TBillingSettingModel = Model<TBillingSettingDocument> & {
  isBillingSettingExist(id: string): Promise<TBillingSettingDocument | null>;
};
