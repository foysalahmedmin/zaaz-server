import mongoose, { Document, Model, Types } from 'mongoose';

export type TPackagePrice = {
  interval: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  previous_price?: number;
  price: number;
  credits: number;
  is_initial: boolean;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TPackagePriceDocument extends TPackagePrice, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPackagePriceDocument | null>;
}

export type TPackagePriceModel = Model<TPackagePriceDocument> & {
  isPackagePriceExist(_id: string): Promise<TPackagePriceDocument | null>;
};
