import Stripe from 'stripe';
import { TPaymentMethod } from '../../modules/payment-method/payment-method.type';
import {
  IPaymentGateway,
  InitiatePaymentData,
  PaymentResponse,
  PaymentVerificationResponse,
  WebhookResponse,
} from '../index';

export class StripeService implements IPaymentGateway {
  private readonly stripe: Stripe;
  private readonly webhookSecret?: string;

  constructor(paymentMethod: TPaymentMethod) {
    this.stripe = new Stripe(paymentMethod.secret, {
      apiVersion: '2025-10-29.clover',
    });
    // Webhook secret can be stored in public_key field or separate config
    this.webhookSecret = paymentMethod.public_key || undefined;
  }

  async initiatePayment(data: InitiatePaymentData): Promise<PaymentResponse> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: data.currency.toLowerCase(),
              product_data: {
                name: `Package Purchase`,
                description: `Token Package Purchase`,
              },
              unit_amount: Math.round(data.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: data.returnUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          userId: data.userId,
          userWalletId: data.userWalletId,
          packageId: data.packageId,
        },
      });

      return {
        success: true,
        gatewayTransactionId: session.id, // Session ID is the transaction ID for checkout sessions
        redirectUrl: session.url || undefined,
      };
    } catch (error: any) {
      throw new Error(`Stripe payment initiation failed: ${error.message}`);
    }
  }

  async verifyPayment(
    transactionId: string,
  ): Promise<PaymentVerificationResponse> {
    try {
      const session =
        await this.stripe.checkout.sessions.retrieve(transactionId);

      return {
        success: session.payment_status === 'paid',
        status: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase() || 'USD',
      };
    } catch (error: any) {
      throw new Error(`Stripe payment verification failed: ${error.message}`);
    }
  }

  async handleWebhook(
    payload: any,
    signature: string,
  ): Promise<WebhookResponse> {
    try {
      if (!this.webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      // Stripe requires raw body buffer for signature verification
      const rawBody = Buffer.isBuffer(payload)
        ? payload
        : Buffer.from(JSON.stringify(payload));

      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        return {
          success: true,
          transactionId: session.id, // Use session ID to match with gateway_transaction_id
          status: session.payment_status === 'paid' ? 'success' : 'failed',
          metadata: {
            userId: session.metadata?.userId,
            userWalletId: session.metadata?.userWalletId,
            packageId: session.metadata?.packageId,
          },
        };
      }

      // Handle other event types if needed
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        return {
          success: true,
          transactionId: paymentIntent.id,
          status: 'success',
        };
      }

      return {
        success: false,
        transactionId: '',
        status: 'pending',
      };
    } catch (error: any) {
      throw new Error(`Stripe webhook handling failed: ${error.message}`);
    }
  }
}
