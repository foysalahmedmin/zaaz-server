import { Document, Model, Types } from 'mongoose';

export type TPaymentMethod = {
  name: string;
  value: string;
  currency: string;
  secret: string;
  description?: string;
  public_key?: string;
  webhook_key?: string;
  webhook_url?: string;
  currencies?: string[];
  config?: Record<string, any>;
  is_test?: boolean;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TPaymentMethodDocument extends TPaymentMethod, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPaymentMethodDocument | null>;
}

export type TPaymentMethodModel = Model<TPaymentMethodDocument> & {
  isPaymentMethodExist(_id: string): Promise<TPaymentMethodDocument | null>;
};
