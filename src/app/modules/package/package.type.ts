import mongoose, { Document, Model, Types } from 'mongoose';

export type TCurrency = 'USD' | 'BDT';

export type TPackagePrice = {
  USD: number;
  BDT: number;
};

export type TPackage = {
  name: string;
  description?: string;
  content?: string;
  token: number;
  features: mongoose.Types.ObjectId[];
  duration?: number;
  price: TPackagePrice;
  price_previous?: TPackagePrice;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TPackageDocument extends TPackage, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPackageDocument | null>;
}

export type TPackageModel = Model<TPackageDocument> & {
  isPackageExist(_id: string): Promise<TPackageDocument | null>;
};
