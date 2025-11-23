export type TTokenProcessStartPayload = {
  user_id: string;
  feature_id: string;
  endpoint: string;
  method: string;
  query?: Record<string, any>;
};

export type TTokenProcessStartResponse = {
  success: boolean;
  data: {
    track_id?: string; // it will be tract generated ID. Optional;
    user_id: string; // user ID;
    user_token: number; // user current token amount;
    status: 'access-able' | 'not-access-able';
  };
};

export type TTokenProcessEndPayload = {
  track_id?: string; // start payload track. Optional;
  user_id: string; // user ID;
  feature_id: string;
  endpoint: string;
  method: string;
  query?: Record<string, any>;
  token_cost: number; // token cost after processing;
};

export type TTokenProcessEndResponse = {
  success: boolean;
  data: {
    user: string;
    status: 'return-able' | 'not-return-able';
    token: number;
    token_cost: number; // token cost after deducted by token profit percentage;
  };
};
