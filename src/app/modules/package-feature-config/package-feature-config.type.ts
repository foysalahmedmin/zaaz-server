import { Document, Model, Types } from 'mongoose';

export type TPackageFeatureConfig = {
  package: Types.ObjectId;
  feature?: Types.ObjectId | null;
  feature_endpoint?: Types.ObjectId | null;
  config: {
    // Credits & Limits
    min_credits?: number;
    max_credits?: number;
    daily_limit?: number;
    monthly_limit?: number;

    // Feature Behavior
    enabled_options?: string[];
    disabled_options?: string[];

    // Quality/Performance Settings
    max_tokens?: number;
    quality_tier?: 'basic' | 'standard' | 'premium';
    priority?: number;

    // Custom Settings (extensible)
    custom?: Record<string, any>;
  };
  description?: string;
  sequence?: number;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export interface TPackageFeatureConfigDocument
  extends TPackageFeatureConfig, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPackageFeatureConfigDocument | null>;
}

export type TPackageFeatureConfigModel =
  Model<TPackageFeatureConfigDocument> & {
    isPackageFeatureConfigExist(
      _id: string,
    ): Promise<TPackageFeatureConfigDocument | null>;
  };
