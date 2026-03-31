export interface GoogleAnalyticsConfig {
  measurementId: string;
  apiSecret?: string;
}

export interface GoogleAnalyticsEvent {
  name: string;
  params?: Record<string, any>;
  user_id?: string;
}
