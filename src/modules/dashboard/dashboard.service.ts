import { withCache } from '../../utils/cache.utils';
import * as DashboardRepository from './dashboard.repository';
import {
  TDashboardCreditsFlow,
  TDashboardFeaturePerformance,
  TDashboardPackagePerformance,
  TDashboardPaymentMethod,
  TDashboardRevenueData,
  TDashboardStatistics,
  TDashboardTransactionStatus,
  TDashboardUserGrowth,
  TrendType,
} from './dashboard.type';

const calculateTrend = (
  current: number,
  previous: number,
): { type: TrendType; percentage: number } => {
  if (previous === 0) {
    return current > 0 ? { type: 'up', percentage: 100 } : { type: 'neutral', percentage: 0 };
  }
  const percentage = ((current - previous) / previous) * 100;
  if (percentage > 0) return { type: 'up', percentage: Math.abs(percentage) };
  if (percentage < 0) return { type: 'down', percentage: Math.abs(percentage) };
  return { type: 'neutral', percentage: 0 };
};

const getDateRange = (period: string = '30d') => {
  const now = new Date();
  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;
  else if (period === '1y') days = 365;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate: now };
};

const getMonthRange = () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  return { currentMonthStart, previousMonthStart, previousMonthEnd };
};

const CACHE_TTL = 300; // 5 minutes

export const getDashboardStatistics = async (): Promise<TDashboardStatistics> => {
  return withCache('dashboard:statistics', CACHE_TTL, async () => {
    const { currentMonthStart, previousMonthStart, previousMonthEnd } = getMonthRange();

    const [currentRevenueResult, previousRevenueResult] = await Promise.all([
      DashboardRepository.getRevenueByMonth({ startDate: currentMonthStart }),
      DashboardRepository.getRevenueByMonth({ startDate: previousMonthStart, endDate: previousMonthEnd }),
    ]);

    const currentRevenue = {
      USD: currentRevenueResult.find((r) => r._id === 'USD')?.total || 0,
      BDT: currentRevenueResult.find((r) => r._id === 'BDT')?.total || 0,
    };
    const previousRevenue = {
      USD: previousRevenueResult.find((r) => r._id === 'USD')?.total || 0,
      BDT: previousRevenueResult.find((r) => r._id === 'BDT')?.total || 0,
    };

    const BDT_TO_USD_RATE = 110;
    const totalUsdEquivalent = currentRevenue.USD + currentRevenue.BDT / BDT_TO_USD_RATE;
    const previousTotalUsdEquivalent = previousRevenue.USD + previousRevenue.BDT / BDT_TO_USD_RATE;

    const [
      totalUsers,
      currentMonthUsers,
      previousMonthUsers,
      totalTransactions,
      currentMonthTransactions,
      previousMonthTransactions,
      totalCredits,
      currentCreditsIncrease,
      previousCreditsIncrease,
    ] = await Promise.all([
      DashboardRepository.countUsers({}),
      DashboardRepository.countUsers({ created_at: { $gte: currentMonthStart } }),
      DashboardRepository.countUsers({ created_at: { $gte: previousMonthStart, $lte: previousMonthEnd } }),
      DashboardRepository.countPaymentTransactions({}),
      DashboardRepository.countPaymentTransactions({ created_at: { $gte: currentMonthStart } }),
      DashboardRepository.countPaymentTransactions({ created_at: { $gte: previousMonthStart, $lte: previousMonthEnd } }),
      DashboardRepository.getTotalCredits(),
      DashboardRepository.getCreditsIncreaseByMonth(currentMonthStart),
      DashboardRepository.getCreditsIncreaseByMonth(previousMonthStart, previousMonthEnd),
    ]);

    return {
      total_revenue: {
        USD: currentRevenue.USD,
        BDT: currentRevenue.BDT,
        total_usd_equivalent: totalUsdEquivalent,
      },
      total_users: totalUsers,
      total_transactions: totalTransactions,
      total_credits: totalCredits,
      trends: {
        revenue: calculateTrend(totalUsdEquivalent, previousTotalUsdEquivalent),
        users: calculateTrend(currentMonthUsers, previousMonthUsers),
        transactions: calculateTrend(currentMonthTransactions, previousMonthTransactions),
        credits: calculateTrend(currentCreditsIncrease, previousCreditsIncrease),
      },
    };
  });
};

export const getDashboardRevenue = async (period: string = '30d'): Promise<TDashboardRevenueData> => {
  return withCache(`dashboard:revenue:${period}`, CACHE_TTL, async () => {
    const { startDate, endDate } = getDateRange(period);
    const result = await DashboardRepository.getRevenueByPeriod(startDate, endDate);

    return result.map((item) => ({
      date: item._id,
      USD: item.amounts.find((a: any) => a.currency === 'USD')?.amount || 0,
      BDT: item.amounts.find((a: any) => a.currency === 'BDT')?.amount || 0,
    }));
  });
};

export const getDashboardTransactions = async (): Promise<TDashboardTransactionStatus> => {
  return withCache('dashboard:transactions', CACHE_TTL, async () => {
    const [statusResult, total] = await Promise.all([
      DashboardRepository.getTransactionStatusBreakdown(),
      DashboardRepository.getTransactionTotal(),
    ]);

    return statusResult.map((item) => ({
      status: item._id,
      count: item.count,
      percentage: total > 0 ? (item.count / total) * 100 : 0,
    }));
  });
};

export const getDashboardPaymentMethods = async (): Promise<TDashboardPaymentMethod> => {
  return withCache('dashboard:payment_methods', CACHE_TTL, async () => {
    const result = await DashboardRepository.getPaymentMethodBreakdown();

    return result.map((item) => ({
      method_name: item.method_name || 'Unknown',
      transaction_count: item.transaction_count,
      revenue: {
        USD: item.revenue.USD || 0,
        BDT: item.revenue.BDT || 0,
      },
    }));
  });
};

export const getDashboardCreditsFlow = async (period: string = '30d'): Promise<TDashboardCreditsFlow> => {
  return withCache(`dashboard:credits_flow:${period}`, CACHE_TTL, async () => {
    const { startDate, endDate } = getDateRange(period);
    const result = await DashboardRepository.getCreditsFlowByPeriod(startDate, endDate);

    return result.map((item) => ({
      date: item._id,
      increase: item.flows.find((f: any) => f.type === 'increase')?.credits || 0,
      decrease: item.flows.find((f: any) => f.type === 'decrease')?.credits || 0,
    }));
  });
};

export const getDashboardUserGrowth = async (period: string = '30d'): Promise<TDashboardUserGrowth> => {
  return withCache(`dashboard:user_growth:${period}`, CACHE_TTL, async () => {
    const { startDate, endDate } = getDateRange(period);
    const result = await DashboardRepository.getUserGrowthByPeriod(startDate, endDate);
    return result.map((item) => ({ date: item._id, count: item.count }));
  });
};

export const getDashboardPackages = async (): Promise<TDashboardPackagePerformance> => {
  return withCache('dashboard:packages', CACHE_TTL, async () => {
    const result = await DashboardRepository.getPackagePerformance();

    return result.map((item) => ({
      package_name: item.package_name || 'Unknown',
      purchase_count: item.purchase_count,
      revenue: {
        USD: item.revenue.USD || 0,
        BDT: item.revenue.BDT || 0,
      },
    }));
  });
};

export const getDashboardFeatures = async (): Promise<TDashboardFeaturePerformance[]> => {
  return withCache('dashboard:features', CACHE_TTL, async () => {
    const result = await DashboardRepository.getFeaturePerformance();

    return result.map((item) => ({
      feature_name: item.feature_name || 'Unknown',
      usage_count: item.usage_count || 0,
      total_credits_used: item.total_credits_used || 0,
    }));
  });
};
