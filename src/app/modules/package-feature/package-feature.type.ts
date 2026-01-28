import { Document, Model, Types } from 'mongoose';
import { TFeature } from '../feature/feature.type';
import { TPackage } from '../package/package.type';

export type TPackageFeature = {
  package: Types.ObjectId | TPackage;
  feature: Types.ObjectId | TFeature;
  is_active: boolean;
  sequence?: number;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type TPackageFeatureDocument = TPackageFeature & Document;
export type TPackageFeatureModel = Model<TPackageFeatureDocument>;
