export interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  baseUrl: string;
}

export interface SSLCommerzInitiateData {
  amount: number;
  currency: string;
  packageId: string;
  userId: string;
  userWalletId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface SSLCommerzPostData {
  store_id: string;
  store_passwd: string;
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  cus_name: string;
  cus_email: string;
  cus_add1: string;
  cus_city: string;
  cus_country: string;
  shipping_method: string;
  product_name: string;
  product_category: string;
  product_profile: string;
  value_a: string;
  value_b: string;
  value_c: string;
}

