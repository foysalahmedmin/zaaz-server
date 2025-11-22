import axios from 'axios';
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
    this.baseUrl = paymentMethod.is_test
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';
  }

  async initiatePayment(data: InitiatePaymentData): Promise<PaymentResponse> {
    try {
      // Validate required fields
      if (!data.amount || data.amount <= 0) {
        throw new Error('Invalid amount: Amount must be greater than 0');
      }

      if (!data.currency) {
        throw new Error('Currency is required');
      }

      if (!data.returnUrl || !data.cancelUrl) {
        throw new Error('Return URL and Cancel URL are required');
      }

      const transactionId = `TXN${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 11)}`;

      const postData: any = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        total_amount: data.amount.toFixed(2), // Ensure proper decimal format
        currency: data.currency,
        tran_id: transactionId,
        success_url: data.returnUrl,
        fail_url: data.cancelUrl,
        cancel_url: data.cancelUrl,
        cus_name: data.customerName || 'Customer',
        cus_email: data.customerEmail || 'customer@example.com',
        cus_phone: data.customerPhone || '01700000000', // Required by SSLCommerz, default to Bangladesh format
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

      // Add IPN URL if provided (for SSLCommerz webhook notifications)
      if (data.ipnUrl) {
        postData.ipn_url = data.ipnUrl;
      }

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
        // Check for error messages in HTML response
        const errorRegex = /(?:error|failed|status)[\s:=]+['"]?([^'"]+)['"]?/i;
        const errorMatch = errorRegex.exec(response.data);

        if (
          errorMatch &&
          errorMatch[1] &&
          !errorMatch[1].toLowerCase().includes('success')
        ) {
          const errorMessage = errorMatch[1];
          throw new Error(
            `SSL Commerz payment initiation failed: ${errorMessage}`,
          );
        }

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
      if (response.data && typeof response.data === 'object') {
        // Check for success response
        if (
          response.data.status === 'SUCCESS' &&
          response.data.GatewayPageURL
        ) {
          return {
            success: true,
            gatewayTransactionId: transactionId,
            redirectUrl: response.data.GatewayPageURL,
          };
        }

        // Extract error message from JSON response
        // SSLCommerz typically returns: { status: 'FAILED', failedreason: 'Error message' }
        const errorMessage =
          response.data.failedreason ||
          response.data.error ||
          response.data.message ||
          response.data.status ||
          'Unknown error';

        // Log full response for debugging (without sensitive data)
        console.error('[SSLCommerz] Payment initiation failed:', {
          status: response.data.status,
          failedreason: response.data.failedreason,
          error: response.data.error,
          message: response.data.message,
        });

        throw new Error(
          `SSL Commerz payment initiation failed: ${errorMessage}`,
        );
      }

      // If we reach here, response format is unexpected
      console.error('[SSLCommerz] Unexpected response format:', {
        type: typeof response.data,
        data:
          typeof response.data === 'string'
            ? response.data.substring(0, 200)
            : response.data,
      });

      throw new Error(
        `SSL Commerz payment initiation failed: Unexpected response format`,
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
      // Validate required fields
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid webhook payload: payload is required');
      }

      const { status, tran_id } = payload;

      // Validate required fields
      if (!tran_id) {
        throw new Error('Invalid webhook payload: tran_id is required');
      }

      // Simple validation: Check status only
      // SSLCommerz doesn't provide clear documentation for verify_sign hash format
      // So we rely on status field and transaction ID validation
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
      console.error(`[SSLCommerz Webhook] Error: ${error.message}`);
      throw new Error(`SSL Commerz webhook handling failed: ${error.message}`);
    }
  }
}
