export type TTokenProcessStartPayload = {
  user_id: string;
  feature_endpoint_id: string;
};

export type TTokenProcessStartResponse = {
  success: boolean;
  message: string;
  data: {
    user_id: string; // user ID;
    token: number; // user current token amount;
    status: 'accessible' | 'not-accessible';
    message?: string;
  };
};

export type TTokenProcessEndPayload = {
  user_id: string;
  feature_endpoint_id: string;
  input_token: number;
  output_token: number;
  model?: string; // optional model name;
};

export type TTokenProcessEndResponse = {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    token: number; // user current token amount;
    cost: number; // token cost after deducted by token profit percentage;
    status: 'returnable' | 'not-returnable';
    message?: string;
  };
};
