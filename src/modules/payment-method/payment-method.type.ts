import { Document, Model, Types } from 'mongoose';

export type TPaymentMethod = {
  name: string;
  value: string;
  currencies: string[];
  description?: string;
  config?: Record<string, any>;
  sequence?: number;
  is_test?: boolean;
  is_recurring: boolean;
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


