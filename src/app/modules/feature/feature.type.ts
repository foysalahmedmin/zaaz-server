import mongoose, { Document, Model, Types } from 'mongoose';

export type TFeatureType = 'writing' | 'generation' | 'other';

export type TFeature = {
  value: string;
  parent?: mongoose.Types.ObjectId | null;
  name: string;
  description?: string;
  path?: string;
  prefix?: string;
  type?: TFeatureType;
  sequence?: number;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TFeatureDocument extends TFeature, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TFeatureDocument | null>;
}

export type TFeatureModel = Model<TFeatureDocument> & {
  isFeatureExist(_id: string): Promise<TFeatureDocument | null>;
};
