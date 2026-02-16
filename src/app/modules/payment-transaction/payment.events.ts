export enum PaymentEvents {
  INITIATED = 'PAYMENT.INITIATED',
  AUTHORIZED = 'PAYMENT.AUTHORIZED',
  COMPLETED = 'PAYMENT.COMPLETED',
  FAILED = 'PAYMENT.FAILED',
  REFUNDED = 'PAYMENT.REFUNDED',
}

export interface PaymentEventPayload {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  packageId?: string;
  planId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}
