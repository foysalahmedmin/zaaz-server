import { TPaymentMethod } from '../modules/payment-method/payment-method.type';
import { SSLCommerzService } from './sslcommerz/sslcommerz.service';
import { StripeService } from './stripe/stripe.service';

export interface InitiatePaymentData {
  amount: number;
  currency: string;
  packageId: string;
  userId: string;
  userWalletId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  gatewayTransactionId: string;
  redirectUrl?: string;
  paymentUrl?: string;
  clientSecret?: string; // For Stripe
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: string;
  amount: number;
  currency: string;
}

export interface WebhookResponse {
  success: boolean;
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  metadata?: {
    userId?: string;
    userWalletId?: string;
    packageId?: string;
  };
}

export interface IPaymentGateway {
  initiatePayment(data: InitiatePaymentData): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<PaymentVerificationResponse>;
  handleWebhook(payload: any, signature: string): Promise<WebhookResponse>;
}

export class PaymentGatewayFactory {
  static create(paymentMethod: TPaymentMethod): IPaymentGateway {
    const methodName = paymentMethod.name.toLowerCase().trim();

    switch (methodName) {
      case 'stripe':
        return new StripeService(paymentMethod);
      case 'sslcommerz':
      case 'sslcommerz':
      case 'ssl commerz':
        return new SSLCommerzService(paymentMethod);
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod.name}`);
    }
  }
}
