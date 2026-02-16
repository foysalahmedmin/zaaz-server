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
  usage_key: string;
  duration?: number;
  usages: {
    input_tokens?: number;
    output_tokens?: number;
    ai_model?: string;
  }[];
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
    total_cost: number;
    details: any[];
  };
};
