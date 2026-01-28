import { Document, Model, Types } from 'mongoose';

export type TCurrency = 'USD' | 'BDT';

export type TPackagePrice = {
  USD: number;
  BDT: number;
};

export type TPackage = {
  value: string;
  name: string;
  description?: string;
  content?: string;
  type?: 'credits' | 'subscription';
  badge?: string;
  points?: string[];
  sequence?: number;
  is_active: boolean;
  is_initial?: boolean;
  is_deleted?: boolean;
};

export interface TPackageDocument extends TPackage, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPackageDocument | null>;
}

export type TPackageModel = Model<TPackageDocument> & {
  isPackageExist(_id: string): Promise<TPackageDocument | null>;
};
