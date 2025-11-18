import mongoose, { Document, Model, Types } from 'mongoose';

export type TCurrency = 'USD' | 'BDT';

export type TPackage = {
  name: string;
  description?: string;
  content?: string;
  token: number;
  features: mongoose.Types.ObjectId[];
  duration?: number;
  price: number;
  price_previous: number;
  currency: TCurrency;
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

