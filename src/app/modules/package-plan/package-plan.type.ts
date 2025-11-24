import mongoose, { Document, Model, Types } from 'mongoose';

export type TPackagePrice = {
  USD: number;
  BDT: number;
};

export type TPackagePlan = {
  plan: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  previous_price?: TPackagePrice;
  price: TPackagePrice;
  token: number;
  is_initial: boolean;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TPackagePlanDocument extends TPackagePlan, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPackagePlanDocument | null>;
}

export type TPackagePlanModel = Model<TPackagePlanDocument> & {
  isPackagePlanExist(_id: string): Promise<TPackagePlanDocument | null>;
};

