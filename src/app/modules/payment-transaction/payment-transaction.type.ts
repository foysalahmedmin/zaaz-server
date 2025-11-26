import mongoose, { Document, Model, Types } from 'mongoose';

export type TPaymentTransactionStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'refunded';

export type TCurrency = 'USD' | 'BDT';

export type TPaymentTransaction = {
  user: mongoose.Types.ObjectId;
  user_wallet: mongoose.Types.ObjectId;
  status: TPaymentTransactionStatus;
  payment_method: mongoose.Types.ObjectId;
  gateway_transaction_id: string; // Optional initially, set after gateway response
  gateway_session_id?: string; // Stripe session ID or SSL Commerz session ID
  gateway_status?: string; // Gateway-specific status (paid, VALID, etc.)
  package: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  price: mongoose.Types.ObjectId; // PackagePlan document _id
  amount: number;
  currency: TCurrency;
  gateway_fee?: number; // Fee charged by payment gateway
  failure_reason?: string; // Reason if payment failed
  refund_id?: string; // Gateway refund transaction ID
  refunded_at?: Date; // Date when refund was processed
  paid_at?: Date; // Date when payment was completed
  failed_at?: Date; // Date when payment failed
  customer_email?: string; // Customer email from gateway
  customer_name?: string; // Customer name from gateway
  return_url?: string; // Frontend return URL (stored for redirect after payment)
  cancel_url?: string; // Frontend cancel URL (stored for redirect after payment)
  gateway_response?: Record<string, any>; // Raw response data from gateway (for debugging)
  is_deleted?: boolean;
};

export interface TPaymentTransactionDocument
  extends TPaymentTransaction,
    Document {
  _id: Types.ObjectId;
}

export type TPaymentTransactionModel = Model<TPaymentTransactionDocument>;
