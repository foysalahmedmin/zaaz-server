import mongoose, { Document, Model, Types } from 'mongoose';

export type TFeatureEndpointMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

export type TFeatureEndpoint = {
  feature: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  endpoint: string;
  method: TFeatureEndpointMethod;
  token: number;
  sequence?: number;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TFeatureEndpointDocument extends TFeatureEndpoint, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TFeatureEndpointDocument | null>;
}

export type TFeatureEndpointModel = Model<TFeatureEndpointDocument> & {
  isFeatureEndpointExist(_id: string): Promise<TFeatureEndpointDocument | null>;
};
