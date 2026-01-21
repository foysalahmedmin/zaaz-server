// bKash Payment Gateway Types
export interface BkashConfig {
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  baseUrl: string;
}

export interface BkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface BkashCreatePaymentRequest {
  mode: string; // "0011" for tokenized checkout
  payerReference: string;
  callbackURL: string;
  amount: string;
  currency: string;
  intent: string; // "sale"
  merchantInvoiceNumber: string;
  merchantAssociationInfo?: string;
}

export interface BkashCreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
}

export interface BkashExecutePaymentRequest {
  paymentID: string;
}

export interface BkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  paymentExecuteTime: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  payerType?: string;
  payerAccount?: string;
  customerMsisdn?: string;
}

export interface BkashQueryPaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  mode: string;
  paymentCreateTime: string;
  paymentExecuteTime?: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  transactionStatus: string;
  trxID?: string;
  verificationStatus?: string;
  payerType?: string;
  payerAccount?: string;
  customerMsisdn?: string;
}

export interface BkashRefundRequest {
  paymentID: string;
  amount: string;
  trxID: string;
  sku: string;
  reason: string;
}

export interface BkashRefundResponse {
  statusCode: string;
  statusMessage: string;
  originalTrxID: string;
  refundTrxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  charge: string;
  completedTime: string;
}
