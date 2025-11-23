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
    status: 'access-able' | 'not-access-able';
  };
};

export type TTokenProcessEndPayload = {
  user_id: string;
  feature_endpoint_id: string;
  cost: number; // token cost after processing;
};

export type TTokenProcessEndResponse = {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    token: number; // user current token amount;
    cost: number; // token cost after deducted by token profit percentage;
    status: 'return-able' | 'not-return-able';
  };
};
