import axios from 'axios';
import crypto from 'crypto';
import { TPaymentMethod } from '../../modules/payment-method/payment-method.type';
import {
  IPaymentGateway,
  InitiatePaymentData,
  PaymentResponse,
  PaymentVerificationResponse,
  WebhookResponse,
} from '../index';

export class SSLCommerzService implements IPaymentGateway {
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly baseUrl: string;

  constructor(paymentMethod: TPaymentMethod) {
    // Parse credentials from secret (format: storeId:storePassword)
    const credentials = paymentMethod.secret.split(':');
    if (credentials.length !== 2) {
      throw new Error(
        'Invalid SSL Commerz credentials format. Expected: storeId:storePassword',
      );
    }
    this.storeId = credentials[0].trim();
    this.storePassword = credentials[1].trim();

    // Use environment variable or default to sandbox
    this.baseUrl =
      process.env.SSL_COMMERZ_URL || 'https://sandbox.sslcommerz.com';
  }

  async initiatePayment(data: InitiatePaymentData): Promise<PaymentResponse> {
    try {
      const transactionId = `TXN${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 11)}`;

      const postData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        total_amount: data.amount,
        currency: data.currency,
        tran_id: transactionId,
        success_url: data.returnUrl,
        fail_url: data.cancelUrl,
        cancel_url: data.cancelUrl,
        cus_name: data.customerName || 'Customer',
        cus_email: data.customerEmail || 'customer@example.com',
        cus_add1: 'Address',
        cus_city: 'City',
        cus_country: 'Bangladesh',
        shipping_method: 'NO',
        product_name: 'Package Purchase',
        product_category: 'Package',
        product_profile: 'general',
        value_a: data.userId,
        value_b: data.userWalletId,
        value_c: data.packageId,
      };

      const response = await axios.post(
        `${this.baseUrl}/gwprocess/v4/api.php`,
        postData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // SSL Commerz returns HTML or JSON based on response
      if (typeof response.data === 'string') {
        // Parse HTML response to extract GatewayPageURL
        const urlRegex = /GatewayPageURL['"]?\s*[:=]\s*['"]([^'"]+)['"]/i;
        const urlMatch = urlRegex.exec(response.data);
        if (urlMatch?.[1]) {
          return {
            success: true,
            gatewayTransactionId: transactionId,
            redirectUrl: urlMatch[1],
          };
        }
      }

      // Handle JSON response
      if (response.data.status === 'SUCCESS' && response.data.GatewayPageURL) {
        return {
          success: true,
          gatewayTransactionId: transactionId,
          redirectUrl: response.data.GatewayPageURL,
        };
      }

      throw new Error(
        `SSL Commerz payment initiation failed: ${response.data.status || 'Unknown error'}`,
      );
    } catch (error: any) {
      throw new Error(
        `SSL Commerz payment initiation failed: ${error.message}`,
      );
    }
  }

  async verifyPayment(
    transactionId: string,
  ): Promise<PaymentVerificationResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php`,
        {
          params: {
            store_id: this.storeId,
            store_passwd: this.storePassword,
            format: 'json',
            v: 1,
            requested_session_id: transactionId,
          },
        },
      );

      const isValid =
        response.data.status === 'VALID' ||
        response.data.status === 'VALIDATED';

      return {
        success: isValid,
        status: response.data.status || 'UNKNOWN',
        amount: Number.parseFloat(response.data.amount || '0'),
        currency: response.data.currency || 'BDT',
      };
    } catch (error: any) {
      throw new Error(
        `SSL Commerz payment verification failed: ${error.message}`,
      );
    }
  }

  async handleWebhook(
    payload: any,
    _signature: string, // SSL Commerz uses verify_sign from payload, not header signature
  ): Promise<WebhookResponse> {
    try {
      const { status, tran_id, val_id, amount, currency, verify_sign } =
        payload;

      // Verify signature/hash (SSL Commerz sends verify_sign in payload, not header)
      const hash = crypto
        .createHash('md5')
        .update(
          `${this.storeId}${tran_id}${val_id}${amount}${currency}${this.storePassword}`,
        )
        .digest('hex')
        .toLowerCase();

      if (hash !== verify_sign?.toLowerCase()) {
        throw new Error('Invalid SSL Commerz webhook signature');
      }

      const isSuccess = status === 'VALID' || status === 'VALIDATED';

      return {
        success: isSuccess,
        transactionId: tran_id,
        status: isSuccess ? 'success' : 'failed',
        metadata: {
          userId: payload.value_a,
          userWalletId: payload.value_b,
          packageId: payload.value_c,
        },
      };
    } catch (error: any) {
      throw new Error(`SSL Commerz webhook handling failed: ${error.message}`);
    }
  }
}
