export type TTokenProcessStartPayload = {
  user_id: string;
  feature_endpoint_id: string;
};

export type TTokenProcessEndPayload = {
  user_id: string;
  feature_endpoint_id: string;
  cost: number;
};
