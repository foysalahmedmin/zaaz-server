export enum PaymentEvents {
  INITIATED = 'PAYMENT.INITIATED',
  AUTHORIZED = 'PAYMENT.AUTHORIZED',
  COMPLETED = 'PAYMENT.COMPLETED',
  FAILED = 'PAYMENT.FAILED',
  REFUNDED = 'PAYMENT.REFUNDED',
}

export interface PaymentEventPayload {
  transaction_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method_id: string;
  package_id?: string;
  interval_id?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}
