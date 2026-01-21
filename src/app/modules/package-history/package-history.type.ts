import mongoose, { Document, Model, Types } from 'mongoose';

export type TPackagePrice = {
  USD: number;
  BDT: number;
};

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

// Embedded plan data structure for history
export type TPlanHistory = {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  duration: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

// Embedded package-plan data structure for history
export type TPackagePlanHistory = {
  _id: mongoose.Types.ObjectId;
  plan: TPlanHistory;
  price: TPackagePrice;
  previous_price?: TPackagePrice;
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
  plans: TPackagePlanHistory[];
  sequence?: number;
  is_active?: boolean;
  is_deleted?: boolean;
};

export interface TPackageHistoryDocument extends TPackageHistory, Document {
  _id: Types.ObjectId;
}

export type TPackageHistoryModel = Model<TPackageHistoryDocument>;
