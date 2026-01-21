export const DEFAULT_BILLING_SETTING = {
  credit_price: Number(process.env.DEFAULT_CREDIT_PRICE || 0.00001),
  currency: 'USD',
  is_initial: true,
  is_active: true,
};
