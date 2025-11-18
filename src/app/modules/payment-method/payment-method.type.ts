import mongoose, { Document, Model, Types } from 'mongoose';

export type TPaymentMethod = {
  name: string;
  currency: string;
  secret: string;
  public_key?: string;
  description?: string;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TPaymentMethodDocument
  extends TPaymentMethod,
    Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPaymentMethodDocument | null>;
}

export type TPaymentMethodModel = Model<TPaymentMethodDocument> & {
  isPaymentMethodExist(
    _id: string,
  ): Promise<TPaymentMethodDocument | null>;
};

