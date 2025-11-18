export interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
}

export interface StripeInitiateData {
  amount: number;
  currency: string;
  packageId: string;
  userId: string;
  userWalletId: string;
  returnUrl: string;
  cancelUrl: string;
}

