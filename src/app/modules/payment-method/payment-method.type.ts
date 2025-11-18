import mongoose, { Document, Model, Types } from 'mongoose';

export type TPaymentMethod = {
  name: string;
  currency: string;
  secret: string;
  public_key?: string;
  description?: string;
  webhook_url?: string; // Webhook URL for this payment method
  test_mode?: boolean; // Whether this is test/sandbox mode
  supported_currencies?: string[]; // Array of supported currencies
  config?: Record<string, any>; // Additional gateway-specific configuration
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

