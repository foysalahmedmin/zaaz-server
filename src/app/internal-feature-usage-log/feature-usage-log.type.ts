export interface TFeatureUsageLogFromServer {
  feature_endpoint_id: string;
  feature_endpoint_value: string;
  user_id: string;
  user_email?: string;
  usage_key?: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  code: number;
  status: 'success' | 'failed';
  type?: string;
  is_deleted?: boolean;
}

export type TFeatureUsageLogResponse = {
  success: boolean;
  message: string;
  data: any;
};
