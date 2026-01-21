import axios, { AxiosInstance } from 'axios';
import { TPaymentMethod } from '../../modules/payment-method/payment-method.type';
import {
  IPaymentGateway,
  InitiatePaymentData,
  PaymentResponse,
  PaymentVerificationResponse,
  WebhookResponse,
} from '../index';
import {
  BkashCreatePaymentRequest,
  BkashCreatePaymentResponse,
  BkashExecutePaymentRequest,
  BkashExecutePaymentResponse,
  BkashQueryPaymentResponse,
  BkashRefundRequest,
  BkashRefundResponse,
  BkashTokenResponse,
} from './bkash.types';

export class BkashService implements IPaymentGateway {
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly baseUrl: string;
  private readonly axiosInstance: AxiosInstance;
  private idToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(paymentMethod: TPaymentMethod) {
    const { username, password, appKey, appSecret } =
      paymentMethod?.config || {};

    this.username = paymentMethod?.is_test
      ? username?.trim() || process.env.BKASH_USERNAME_TEST || ''
      : username?.trim() || process.env.BKASH_USERNAME || '';

    this.password = paymentMethod?.is_test
      ? password?.trim() || process.env.BKASH_PASSWORD_TEST || ''
      : password?.trim() || process.env.BKASH_PASSWORD || '';

    this.appKey = paymentMethod?.is_test
      ? appKey?.trim() || process.env.BKASH_APP_KEY_TEST || ''
      : appKey?.trim() || process.env.BKASH_APP_KEY || '';

    this.appSecret = paymentMethod?.is_test
      ? appSecret?.trim() || process.env.BKASH_APP_SECRET_TEST || ''
      : appSecret?.trim() || process.env.BKASH_APP_SECRET || '';

    if (!this.appKey || !this.appSecret || !this.username || !this.password) {
      throw new Error(
        'Invalid bKash credentials. Required: appKey, appSecret, username, password in config',
      );
    }

    // Set base URL based on test/production mode
    this.baseUrl = paymentMethod.is_test
      ? process.env.BKASH_SANDBOX_BASE_URL_TEST ||
        'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
      : process.env.BKASH_SANDBOX_BASE_URL ||
        'https://tokenized.pay.bka.sh/v1.2.0-beta';

    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Grant Token - Get authentication token from bKash
   */
  private async grantToken(): Promise<string> {
    try {
      // Check if token is still valid (with 5 minute buffer)
      if (
        this.idToken &&
        this.tokenExpiresAt &&
        Date.now() < this.tokenExpiresAt - 5 * 60 * 1000
      ) {
        return this.idToken;
      }

      const response = await this.axiosInstance.post<BkashTokenResponse>(
        '/tokenized/checkout/token/grant',
        {
          app_key: this.appKey,
          app_secret: this.appSecret,
        },
        {
          headers: {
            username: this.username,
            password: this.password,
          },
        },
      );

      if (response.data && response.data.id_token) {
        const token = response.data.id_token;
        this.idToken = token;
        // Token expires in seconds, convert to milliseconds
        this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
        return token;
      }

      throw new Error(
        `bKash token grant failed: ${response.data?.statusMessage || 'Unknown error'}`,
      );
    } catch (error: any) {
      this.idToken = null;
      this.tokenExpiresAt = null;
      throw new Error(
        `bKash token grant failed: ${error.response?.data?.statusMessage || error.message}`,
      );
    }
  }

  /**
   * Initiate Payment - Create payment and get bKash URL
   */
  async initiatePayment(data: InitiatePaymentData): Promise<PaymentResponse> {
    try {
      // Get authentication token
      const token = await this.grantToken();

      // Generate unique merchant invoice number
      const merchantInvoiceNumber = `INV${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Prepare create payment request
      const createPaymentRequest: BkashCreatePaymentRequest = {
        mode: '0011', // Tokenized checkout mode
        payerReference: data.customerPhone || data.customerEmail || data.userId,
        callbackURL: data.returnUrl, // Base callback URL
        amount: data.amount.toFixed(2),
        currency: data.currency,
        intent: 'sale',
        merchantInvoiceNumber: merchantInvoiceNumber,
      };

      // Create payment
      const response =
        await this.axiosInstance.post<BkashCreatePaymentResponse>(
          '/tokenized/checkout/create',
          createPaymentRequest,
          {
            headers: {
              Authorization: token,
              'X-APP-Key': this.appKey,
            },
          },
        );

      // Check for successful response
      if (
        response.data &&
        response.data.statusCode === '0000' &&
        response.data.paymentID
      ) {
        return {
          success: true,
          gatewayTransactionId: response.data.paymentID,
          redirectUrl: response.data.bkashURL,
        };
      }

      // Handle error response
      throw new Error(
        `bKash payment creation failed: ${response.data?.statusMessage || 'Unknown error'}`,
      );
    } catch (error: any) {
      throw new Error(
        `bKash payment initiation failed: ${error.response?.data?.statusMessage || error.message}`,
      );
    }
  }

  /**
   * Execute Payment - Complete payment after user authorization
   */
  async executePayment(
    paymentID: string,
  ): Promise<BkashExecutePaymentResponse> {
    try {
      const token = await this.grantToken();

      const executeRequest: BkashExecutePaymentRequest = {
        paymentID: paymentID,
      };

      const response =
        await this.axiosInstance.post<BkashExecutePaymentResponse>(
          '/tokenized/checkout/execute',
          executeRequest,
          {
            headers: {
              Authorization: token,
              'X-APP-Key': this.appKey,
            },
          },
        );

      if (response.data && response.data.statusCode === '0000') {
        return response.data;
      }

      throw new Error(
        `bKash payment execution failed: ${response.data?.statusMessage || 'Unknown error'}`,
      );
    } catch (error: any) {
      throw new Error(
        `bKash payment execution failed: ${error.response?.data?.statusMessage || error.message}`,
      );
    }
  }

  /**
   * Verify Payment - Query payment status
   */
  async verifyPayment(
    transactionId: string,
  ): Promise<PaymentVerificationResponse> {
    try {
      const token = await this.grantToken();

      const response = await this.axiosInstance.get<BkashQueryPaymentResponse>(
        `/tokenized/checkout/payment/status`,
        {
          headers: {
            Authorization: token,
            'X-APP-Key': this.appKey,
          },
          params: {
            paymentID: transactionId,
          },
        },
      );

      if (response.data) {
        const isSuccess =
          response.data.transactionStatus === 'Completed' &&
          response.data.statusCode === '0000';

        return {
          success: isSuccess,
          status: response.data.transactionStatus,
          amount: Number.parseFloat(response.data.amount || '0'),
          currency: response.data.currency || 'BDT',
        };
      }

      throw new Error('Invalid response from bKash');
    } catch (error: any) {
      throw new Error(
        `bKash payment verification failed: ${error.response?.data?.statusMessage || error.message}`,
      );
    }
  }

  /**
   * Handle Webhook - Process bKash callback
   */
  async handleWebhook(
    payload: any,
    _signature: string,
  ): Promise<WebhookResponse> {
    try {
      // bKash sends callback with query parameters
      // Extract paymentID from payload
      const { paymentID } = payload;

      if (!paymentID) {
        throw new Error('Invalid webhook payload: paymentID is required');
      }

      // Verify payment status by querying bKash
      const verificationResult = await this.verifyPayment(paymentID);

      return {
        success: verificationResult.success,
        transactionId: paymentID,
        status: verificationResult.success ? 'success' : 'failed',
      };
    } catch (error: any) {
      console.error(`[bKash Webhook] Error: ${error.message}`);
      throw new Error(`bKash webhook handling failed: ${error.message}`);
    }
  }

  /**
   * Refund Transaction - Refund a completed payment
   */
  async refundTransaction(
    paymentID: string,
    trxID: string,
    amount: string,
    reason: string,
  ): Promise<BkashRefundResponse> {
    try {
      const token = await this.grantToken();

      const refundRequest: BkashRefundRequest = {
        paymentID: paymentID,
        amount: amount,
        trxID: trxID,
        sku: 'payment',
        reason: reason,
      };

      const response = await this.axiosInstance.post<BkashRefundResponse>(
        '/tokenized/checkout/payment/refund',
        refundRequest,
        {
          headers: {
            Authorization: token,
            'X-APP-Key': this.appKey,
          },
        },
      );

      if (response.data && response.data.statusCode === '0000') {
        return response.data;
      }

      throw new Error(
        `bKash refund failed: ${response.data?.statusMessage || 'Unknown error'}`,
      );
    } catch (error: any) {
      throw new Error(
        `bKash refund failed: ${error.response?.data?.statusMessage || error.message}`,
      );
    }
  }
}
