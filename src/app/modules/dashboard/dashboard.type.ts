export type TrendType = 'up' | 'down' | 'neutral';

export type TDashboardStatistics = {
  total_revenue: {
    USD: number;
    BDT: number;
    total_usd_equivalent: number;
  };
  total_users: number;
  total_transactions: number;
  total_tokens: number;
  trends: {
    revenue: { type: TrendType; percentage: number };
    users: { type: TrendType; percentage: number };
    transactions: { type: TrendType; percentage: number };
    tokens: { type: TrendType; percentage: number };
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

export type TDashboardTokenFlow = {
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
  total_tokens_used: number;
}[];

