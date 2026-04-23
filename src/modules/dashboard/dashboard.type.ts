export type TrendType = 'up' | 'down' | 'neutral';

export type TTrend = {
  type: TrendType;
  percentage: number;
};

export type TDashboardStatistics = {
  monthly_revenue: {
    USD: number;
    BDT: number;
    total_usd_equivalent: number;
  };
  total_users: number;
  total_payment_transactions: number;
  total_package_assignments: number;
  total_credits_in_circulation: number;
  monthly_credits_consumed: number;
  active_subscriptions: number;
  trends: {
    revenue: TTrend;
    users: TTrend;
    payment_transactions: TTrend;
    package_assignments: TTrend;
    credits_consumed: TTrend;
  };
};

export type TDashboardRevenueData = {
  date: string;
  USD: number;
  BDT: number;
}[];

export type TDashboardTransactionStatus = {
  status: string;
  count: number;
  percentage: number;
}[];

export type TDashboardPaymentMethod = {
  method_name: string;
  transaction_count: number;
  revenue: { USD: number; BDT: number };
}[];

export type TDashboardCreditsFlow = {
  date: string;
  increase: number;
  decrease: number;
}[];

export type TDashboardUserGrowth = {
  date: string;
  count: number;
}[];

export type TDashboardPackagePerformance = {
  package_name: string;
  purchase_count: number;
  revenue: { USD: number; BDT: number };
}[];

export type TDashboardFeaturePerformance = {
  feature_name: string;
  usage_count: number;
  total_credits_used: number;
}[];

export type TDashboardAiModelUsage = {
  model_name: string;
  provider: string;
  usage_count: number;
  total_tokens_used: number;
  total_credits_charged: number;
}[];

export type TDashboardPackageAssignments = {
  date: string;
  count: number;
}[];
