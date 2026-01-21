export type TCreditsProcessStartPayload = {
  user_id: string;
  user_email?: string;
  feature_endpoint_id?: string;
  feature_endpoint_value?: string;
  duration?: number;
};

export type TCreditsProcessStartResponse = {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    usage_key: string;
    credits: number;
    status: 'accessible' | 'not-accessible';
    message?: string;
  };
};

export type TCreditsProcessEndPayload = {
  user_id: string;
  user_email?: string;
  feature_endpoint_id?: string;
  feature_endpoint_value?: string;
  input_tokens?: number;
  output_tokens?: number;
  ai_model?: string;
  usage_key: string;
  duration?: number;
};

export type TCreditsProcessEndResponse = {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    usage_key: string;
    credits: number;
    status: 'returnable' | 'not-returnable';
    message?: string;
    details?: {
      ai_model?: string;
      input_token?: number;
      output_token?: number;
      input_credits?: number;
      output_credits?: number;
      cost_credits?: number;
      profit_credits?: number;
      cost_price?: number;
    };
  };
};

export type TCreditsProcessEndMultimodelPayload = {
  user_id: string;
  user_email?: string;
  feature_endpoint_id?: string;
  feature_endpoint_value?: string;
  usage_key: string;
  duration?: number;
  usages: {
    input_tokens?: number;
    output_tokens?: number;
    ai_model?: string;
  }[];
};

export type TCreditsProcessEndMultimodelResponse = {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    usage_key: string;
    credits: number;
    status: 'returnable' | 'not-returnable';
    message?: string;
    total_cost: number;
    details: any[];
  };
};
