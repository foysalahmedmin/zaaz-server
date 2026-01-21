import { withCache } from '../../utils/cache.utils';
import { CreditsTransaction } from '../credits-transaction/credits-transaction.model';
import { Feature } from '../feature/feature.model';
import { PaymentTransaction } from '../payment-transaction/payment-transaction.model';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { User } from '../user/user.model';
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

// Helper function to calculate trend
const calculateTrend = (
  current: number,
  previous: number,
): { type: TrendType; percentage: number } => {
  if (previous === 0) {
    return current > 0
      ? { type: 'up', percentage: 100 }
      : { type: 'neutral', percentage: 0 };
  }
  const percentage = ((current - previous) / previous) * 100;
  if (percentage > 0) return { type: 'up', percentage: Math.abs(percentage) };
  if (percentage < 0) return { type: 'down', percentage: Math.abs(percentage) };
  return { type: 'neutral', percentage: 0 };
};

// Helper function to get date range
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

// Helper function to get month range
const getMonthRange = () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  return { currentMonthStart, previousMonthStart, previousMonthEnd };
};

const CACHE_TTL = 300; // 5 minutes

export const getDashboardStatistics =
  async (): Promise<TDashboardStatistics> => {
    return withCache('dashboard:statistics', CACHE_TTL, async () => {
      const { currentMonthStart, previousMonthStart, previousMonthEnd } =
        getMonthRange();

      // Get current month revenue
      const currentRevenueResult = await PaymentTransaction.aggregate([
        {
          $match: {
            status: 'success',
            is_deleted: { $ne: true },
            created_at: { $gte: currentMonthStart },
          },
        },
        {
          $group: {
            _id: '$currency',
            total: { $sum: '$amount' },
          },
        },
      ]);

      // Get previous month revenue
      const previousRevenueResult = await PaymentTransaction.aggregate([
        {
          $match: {
            status: 'success',
            is_deleted: { $ne: true },
            created_at: { $gte: previousMonthStart, $lte: previousMonthEnd },
          },
        },
        {
          $group: {
            _id: '$currency',
            total: { $sum: '$amount' },
          },
        },
      ]);

      const currentRevenue = {
        USD: currentRevenueResult.find((r) => r._id === 'USD')?.total || 0,
        BDT: currentRevenueResult.find((r) => r._id === 'BDT')?.total || 0,
      };

      const previousRevenue = {
        USD: previousRevenueResult.find((r) => r._id === 'USD')?.total || 0,
        BDT: previousRevenueResult.find((r) => r._id === 'BDT')?.total || 0,
      };

      // Convert BDT to USD (approximate rate: 1 USD = 110 BDT)
      const BDT_TO_USD_RATE = 110;
      const totalUsdEquivalent =
        currentRevenue.USD + currentRevenue.BDT / BDT_TO_USD_RATE;
      const previousTotalUsdEquivalent =
        previousRevenue.USD + previousRevenue.BDT / BDT_TO_USD_RATE;

      // Get total users
      const totalUsers = await User.countDocuments({
        is_deleted: { $ne: true },
        status: { $ne: 'blocked' },
      });

      // Get current month users
      const currentMonthUsers = await User.countDocuments({
        is_deleted: { $ne: true },
        status: { $ne: 'blocked' },
        created_at: { $gte: currentMonthStart },
      });

      // Get previous month users
      const previousMonthUsers = await User.countDocuments({
        is_deleted: { $ne: true },
        status: { $ne: 'blocked' },
        created_at: { $gte: previousMonthStart, $lte: previousMonthEnd },
      });

      // Get total transactions
      const totalTransactions = await PaymentTransaction.countDocuments({
        is_deleted: { $ne: true },
      });

      // Get current month transactions
      const currentMonthTransactions = await PaymentTransaction.countDocuments({
        is_deleted: { $ne: true },
        created_at: { $gte: currentMonthStart },
      });

      // Get previous month transactions
      const previousMonthTransactions = await PaymentTransaction.countDocuments(
        {
          is_deleted: { $ne: true },
          created_at: { $gte: previousMonthStart, $lte: previousMonthEnd },
        },
      );

      // Get total tokens from active wallets
      const totalCreditsResult = await UserWallet.aggregate([
        {
          $match: {
            is_deleted: { $ne: true },
            $or: [
              { expires_at: { $exists: false } },
              { expires_at: { $gte: new Date() } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$credits' },
          },
        },
      ]);

      const totalCredits = totalCreditsResult[0]?.total || 0;

      // Get current month credits transactions (increase)
      const currentMonthCreditsIncrease = await CreditsTransaction.aggregate([
        {
          $match: {
            is_deleted: { $ne: true },
            type: 'increase',
            created_at: { $gte: currentMonthStart },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$credits' },
          },
        },
      ]);

      const previousMonthCreditsIncrease = await CreditsTransaction.aggregate([
        {
          $match: {
            is_deleted: { $ne: true },
            type: 'increase',
            created_at: { $gte: previousMonthStart, $lte: previousMonthEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$credits' },
          },
        },
      ]);

      const currentCreditsIncrease = currentMonthCreditsIncrease[0]?.total || 0;
      const previousCreditsIncrease =
        previousMonthCreditsIncrease[0]?.total || 0;

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
          revenue: calculateTrend(
            totalUsdEquivalent,
            previousTotalUsdEquivalent,
          ),
          users: calculateTrend(currentMonthUsers, previousMonthUsers),
          transactions: calculateTrend(
            currentMonthTransactions,
            previousMonthTransactions,
          ),
          credits: calculateTrend(
            currentCreditsIncrease,
            previousCreditsIncrease,
          ),
        },
      };
    });
  };

export const getDashboardRevenue = async (
  period: string = '30d',
): Promise<TDashboardRevenueData> => {
  return withCache(`dashboard:revenue:${period}`, CACHE_TTL, async () => {
    const { startDate, endDate } = getDateRange(period);

    const result = await PaymentTransaction.aggregate([
      {
        $match: {
          status: 'success',
          is_deleted: { $ne: true },
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
            },
            currency: '$currency',
          },
          amount: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          amounts: {
            $push: {
              currency: '$_id.currency',
              amount: '$amount',
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return result.map((item) => {
      const usdAmount =
        item.amounts.find((a: any) => a.currency === 'USD')?.amount || 0;
      const bdtAmount =
        item.amounts.find((a: any) => a.currency === 'BDT')?.amount || 0;
      return {
        date: item._id,
        USD: usdAmount,
        BDT: bdtAmount,
      };
    });
  });
};

export const getDashboardTransactions =
  async (): Promise<TDashboardTransactionStatus> => {
    return withCache('dashboard:transactions', CACHE_TTL, async () => {
      const totalResult = await PaymentTransaction.aggregate([
        {
          $match: {
            is_deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
      ]);

      const total = totalResult[0]?.total || 0;

      const statusResult = await PaymentTransaction.aggregate([
        {
          $match: {
            is_deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      return statusResult.map((item) => ({
        status: item._id,
        count: item.count,
        percentage: total > 0 ? (item.count / total) * 100 : 0,
      }));
    });
  };

export const getDashboardPaymentMethods =
  async (): Promise<TDashboardPaymentMethod> => {
    return withCache('dashboard:payment_methods', CACHE_TTL, async () => {
      const result = await PaymentTransaction.aggregate([
        {
          $match: {
            is_deleted: { $ne: true },
          },
        },
        {
          $lookup: {
            from: 'paymentmethods',
            localField: 'payment_method',
            foreignField: '_id',
            as: 'paymentMethodData',
          },
        },
        {
          $unwind: {
            path: '$paymentMethodData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$payment_method',
            method_name: { $first: '$paymentMethodData.name' },
            transactions: {
              $push: {
                currency: '$currency',
                amount: '$amount',
                status: '$status',
              },
            },
          },
        },
        {
          $project: {
            method_name: 1,
            transaction_count: { $size: '$transactions' },
            revenue: {
              USD: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$transactions',
                        as: 't',
                        cond: {
                          $and: [
                            { $eq: ['$$t.currency', 'USD'] },
                            { $eq: ['$$t.status', 'success'] },
                          ],
                        },
                      },
                    },
                    as: 't',
                    in: '$$t.amount',
                  },
                },
              },
              BDT: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$transactions',
                        as: 't',
                        cond: {
                          $and: [
                            { $eq: ['$$t.currency', 'BDT'] },
                            { $eq: ['$$t.status', 'success'] },
                          ],
                        },
                      },
                    },
                    as: 't',
                    in: '$$t.amount',
                  },
                },
              },
            },
          },
        },
        {
          $sort: { transaction_count: -1 },
        },
      ]);

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

export const getDashboardCreditsFlow = async (
  period: string = '30d',
): Promise<TDashboardCreditsFlow> => {
  return withCache(`dashboard:credits_flow:${period}`, CACHE_TTL, async () => {
    const { startDate, endDate } = getDateRange(period);

    const result = await CreditsTransaction.aggregate([
      {
        $match: {
          is_deleted: { $ne: true },
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
            },
            type: '$type',
          },
          credits: { $sum: '$credits' },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          flows: {
            $push: {
              type: '$_id.type',
              credits: '$credits',
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return result.map((item) => {
      const increase =
        item.flows.find((f: any) => f.type === 'increase')?.credits || 0;
      const decrease =
        item.flows.find((f: any) => f.type === 'decrease')?.credits || 0;
      return {
        date: item._id,
        increase,
        decrease,
      };
    });
  });
};

export const getDashboardUserGrowth = async (
  period: string = '30d',
): Promise<TDashboardUserGrowth> => {
  return withCache(`dashboard:user_growth:${period}`, CACHE_TTL, async () => {
    const { startDate, endDate } = getDateRange(period);

    const result = await User.aggregate([
      {
        $match: {
          is_deleted: { $ne: true },
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return result.map((item) => ({
      date: item._id,
      count: item.count,
    }));
  });
};

export const getDashboardPackages =
  async (): Promise<TDashboardPackagePerformance> => {
    return withCache('dashboard:packages', CACHE_TTL, async () => {
      const result = await PaymentTransaction.aggregate([
        {
          $match: {
            is_deleted: { $ne: true },
            status: 'success',
          },
        },
        {
          $lookup: {
            from: 'packages',
            localField: 'package',
            foreignField: '_id',
            as: 'packageData',
          },
        },
        {
          $unwind: {
            path: '$packageData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$package',
            package_name: { $first: '$packageData.name' },
            purchases: {
              $push: {
                currency: '$currency',
                amount: '$amount',
              },
            },
          },
        },
        {
          $project: {
            package_name: 1,
            purchase_count: { $size: '$purchases' },
            revenue: {
              USD: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$purchases',
                        as: 'p',
                        cond: { $eq: ['$$p.currency', 'USD'] },
                      },
                    },
                    as: 'p',
                    in: '$$p.amount',
                  },
                },
              },
              BDT: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$purchases',
                        as: 'p',
                        cond: { $eq: ['$$p.currency', 'BDT'] },
                      },
                    },
                    as: 'p',
                    in: '$$p.amount',
                  },
                },
              },
            },
          },
        },
        {
          $sort: { purchase_count: -1 },
        },
      ]);

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

export const getDashboardFeatures = async (): Promise<
  TDashboardFeaturePerformance[]
> => {
  return withCache('dashboard:features', CACHE_TTL, async () => {
    const result = await Feature.aggregate([
      {
        $match: {
          is_deleted: { $ne: true },
          is_active: true,
        },
      },
      {
        $lookup: {
          from: 'featureendpoints',
          localField: '_id',
          foreignField: 'feature',
          as: 'featureEndpoints',
        },
      },
      {
        $unwind: {
          path: '$featureEndpoints',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { 'featureEndpoints.is_deleted': { $ne: true } },
            { featureEndpoints: { $exists: false } },
          ],
        },
      },
      {
        $lookup: {
          from: 'creditstransactions',
          localField: 'featureEndpoints._id',
          foreignField: 'decrease_source',
          as: 'creditsTransactions',
        },
      },
      {
        $group: {
          _id: '$_id',
          feature_name: { $first: '$name' },
          usage_count: {
            $sum: {
              $size: {
                $filter: {
                  input: '$creditsTransactions',
                  as: 'tt',
                  cond: {
                    $and: [
                      { $ne: ['$$tt.is_deleted', true] },
                      { $eq: ['$$tt.type', 'decrease'] },
                    ],
                  },
                },
              },
            },
          },
          total_credits_used: {
            $sum: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$creditsTransactions',
                      as: 'ct',
                      cond: {
                        $and: [
                          { $ne: ['$$ct.is_deleted', true] },
                          { $eq: ['$$ct.type', 'decrease'] },
                        ],
                      },
                    },
                  },
                  as: 'ct',
                  in: '$$ct.credits',
                },
              },
            },
          },
        },
      },
      {
        $sort: { usage_count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return result.map((item) => ({
      feature_name: item.feature_name || 'Unknown',
      usage_count: item.usage_count || 0,
      total_credits_used: item.total_credits_used || 0,
    }));
  });
};
