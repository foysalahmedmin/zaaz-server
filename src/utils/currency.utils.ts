import config from '../config/env';

export const convertToCurrency = (amountInUSD: number, targetCurrency: string): number => {
  if (targetCurrency === 'USD') {
    return amountInUSD;
  }

  const rate = config.exchange_rates[targetCurrency as keyof typeof config.exchange_rates];

  if (!rate) {
    throw new Error(`Exchange rate for ${targetCurrency} not found.`);
  }

  return Number((amountInUSD * rate).toFixed(2));
};

export const getPriceInCurrency = (priceInUSD: number, currency: string) => {
  return convertToCurrency(priceInUSD, currency);
};
