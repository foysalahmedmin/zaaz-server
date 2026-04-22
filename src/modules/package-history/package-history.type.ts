import mongoose, { Document, Model, Types } from 'mongoose';

// Embedded feature data structure for history
export type TFeatureHistory = {
  _id: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId | null;
  name: string;
  description?: string;
  path?: string;
  prefix?: string;
  type?: 'writing' | 'generation' | 'other';
  sequence?: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

// Embedded interval data structure for history
export type TIntervalHistory = {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  duration: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

// Embedded package-price data structure for history
export type TPackagePriceHistory = {
  _id: mongoose.Types.ObjectId;
  interval: TIntervalHistory;
  price: number;
  previous_price?: number;
  credits: number;
  is_initial: boolean;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type TPackageHistory = {
  package: mongoose.Types.ObjectId;
  value?: string;
  name: string;
  description?: string;
  content?: string;
  type?: 'credits' | 'subscription';
  badge?: string;
  points?: string[];
  features: TFeatureHistory[];
  prices: TPackagePriceHistory[];
  sequence?: number;
  is_active?: boolean;
  version?: number;
  is_deleted?: boolean;
};

export interface TPackageHistoryDocument extends TPackageHistory, Document {
  _id: Types.ObjectId;
}

export type TPackageHistoryModel = Model<TPackageHistoryDocument>;
