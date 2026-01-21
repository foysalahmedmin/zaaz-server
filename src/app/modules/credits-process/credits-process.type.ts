export type TCreditsProcessStartPayload = {
  user_id: string;
  user_email?: string;
  feature_endpoint_id?: string;
  feature_endpoint_value?: string;
};

export type TCreditsProcessEndPayload = {
  user_id: string;
  user_email?: string;
  feature_endpoint_id?: string;
  feature_endpoint_value?: string;
  input_token?: number;
  input_tokens?: number;
  output_token?: number;
  output_tokens?: number;
  ai_model?: string;
  usage_key?: string;
  duration?: number;
};

export type TCreditsProcessEndMultimodelPayload = {
  user_id: string;
  user_email?: string;
  feature_endpoint_id?: string;
  feature_endpoint_value?: string;
  usage_key?: string;
  duration?: number;
  usages?: {
    input_tokens?: number;
    output_tokens?: number;
    ai_model?: string;
  }[];
};

export type TCreditsProcessStartResponse = {
  user_id: string;
  usage_key?: string;
  credits: number;
  status: 'accessible' | 'not-accessible';
  message?: string;
};

export type TCreditsProcessEndResponse = {
  user_id: string;
  usage_key?: string;
  credits: number;
  status: 'returnable';
  message: string;
  details: {
    ai_model?: string;
    input_tokens: number;
    output_tokens: number;
    input_credits: number;
    output_credits: number;
    input_token_price: number;
    output_token_price: number;
    profit_credits_percentage: number;
    profit_credits: number;
    cost_credits: number;
    credits: number;
    price: number;
    rounding_credits: number;
    rounding_price: number;
    credit_price: number;
    cost_price: number;
  };
};

export type TCreditsProcessEndMultimodelResponse = {
  user_id: string;
  usage_key?: string;
  credits: number;
  status: 'returnable';
  message: string;
  details: {
    ai_model?: string;
    input_tokens: number;
    output_tokens: number;
    input_credits: number;
    output_credits: number;
    input_token_price: number;
    output_token_price: number;
    profit_credits_percentage: number;
    profit_credits: number;
    cost_credits: number;
    credits: number;
    price: number;
    rounding_credits: number;
    rounding_price: number;
    credit_price: number;
    cost_price: number;
  }[];
};
