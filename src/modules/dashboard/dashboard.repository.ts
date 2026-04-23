import { CreditsTransaction } from '../credits-transaction/credits-transaction.model';
import { Feature } from '../feature/feature.model';
import { FeatureUsageLog } from '../feature-usage-log/feature-usage-log.model';
import { PackageTransaction } from '../package-transaction/package-transaction.model';
import { PaymentTransaction } from '../payment-transaction/payment-transaction.model';
import { UserSubscription } from '../user-subscription/user-subscription.model';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { User } from '../user/user.model';

export const getRevenueByMonth = async (filter: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{ _id: string; total: number }[]> => {
  return PaymentTransaction.aggregate([
    {
      $match: {
        status: 'success',
        is_deleted: { $ne: true },
        ...(filter.startDate
          ? { created_at: { $gte: filter.startDate, ...(filter.endDate ? { $lte: filter.endDate } : {}) } }
          : {}),
      },
    },
    { $group: { _id: '$currency', total: { $sum: '$amount' } } },
  ]);
};

export const countUsers = async (filter: Record<string, unknown>): Promise<number> => {
  return User.countDocuments({ is_deleted: { $ne: true }, status: { $ne: 'blocked' }, ...filter });
};

export const countPaymentTransactions = async (filter: Record<string, unknown>): Promise<number> => {
  return PaymentTransaction.countDocuments({ is_deleted: { $ne: true }, ...filter });
};

export const countPackageTransactions = async (filter: Record<string, unknown>): Promise<number> => {
  return PackageTransaction.countDocuments({ is_deleted: { $ne: true }, ...filter });
};

export const getTotalCredits = async (): Promise<number> => {
  const result = await UserWallet.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$credits' } } },
  ]);
  return result[0]?.total || 0;
};

export const getCreditsIncreaseByMonth = async (startDate: Date, endDate?: Date): Promise<number> => {
  const result = await CreditsTransaction.aggregate([
    {
      $match: {
        is_deleted: { $ne: true },
        type: 'increase',
        created_at: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) },
      },
    },
    { $group: { _id: null, total: { $sum: '$credits' } } },
  ]);
  return result[0]?.total || 0;
};

export const getTotalCreditsConsumed = async (startDate?: Date, endDate?: Date): Promise<number> => {
  const result = await CreditsTransaction.aggregate([
    {
      $match: {
        is_deleted: { $ne: true },
        type: 'decrease',
        ...(startDate
          ? { created_at: { $gte: startDate, ...(endDate ? { $lte: endDate } : {}) } }
          : {}),
      },
    },
    { $group: { _id: null, total: { $sum: '$credits' } } },
  ]);
  return result[0]?.total || 0;
};

export const countActiveSubscriptions = async (): Promise<number> => {
  return UserSubscription.countDocuments({ is_deleted: { $ne: true }, status: 'active' });
};

export const getRevenueByPeriod = async (startDate: Date, endDate: Date): Promise<any[]> => {
  return PaymentTransaction.aggregate([
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
          date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          currency: '$currency',
        },
        amount: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        amounts: { $push: { currency: '$_id.currency', amount: '$amount' } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

export const getTransactionStatusBreakdown = async (): Promise<any[]> => {
  return PaymentTransaction.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
};

export const getTransactionTotal = async (): Promise<number> => {
  const result = await PaymentTransaction.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: 1 } } },
  ]);
  return result[0]?.total || 0;
};

export const getPaymentMethodBreakdown = async (): Promise<any[]> => {
  return PaymentTransaction.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    {
      $lookup: {
        from: 'paymentmethods',
        localField: 'payment_method',
        foreignField: '_id',
        as: 'paymentMethodData',
      },
    },
    { $unwind: { path: '$paymentMethodData', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$payment_method',
        method_name: { $first: '$paymentMethodData.name' },
        transactions: { $push: { currency: '$currency', amount: '$amount', status: '$status' } },
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
                    cond: { $and: [{ $eq: ['$$t.currency', 'USD'] }, { $eq: ['$$t.status', 'success'] }] },
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
                    cond: { $and: [{ $eq: ['$$t.currency', 'BDT'] }, { $eq: ['$$t.status', 'success'] }] },
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
    { $sort: { transaction_count: -1 } },
  ]);
};

export const getCreditsFlowByPeriod = async (startDate: Date, endDate: Date): Promise<any[]> => {
  return CreditsTransaction.aggregate([
    {
      $match: {
        is_deleted: { $ne: true },
        created_at: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          type: '$type',
        },
        credits: { $sum: '$credits' },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        flows: { $push: { type: '$_id.type', credits: '$credits' } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

export const getUserGrowthByPeriod = async (startDate: Date, endDate: Date): Promise<any[]> => {
  return User.aggregate([
    {
      $match: {
        is_deleted: { $ne: true },
        created_at: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

export const getPackagePerformance = async (): Promise<any[]> => {
  return PaymentTransaction.aggregate([
    { $match: { is_deleted: { $ne: true }, status: 'success' } },
    {
      $lookup: {
        from: 'packages',
        localField: 'package',
        foreignField: '_id',
        as: 'packageData',
      },
    },
    { $unwind: { path: '$packageData', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$package',
        package_name: { $first: '$packageData.name' },
        purchases: { $push: { currency: '$currency', amount: '$amount' } },
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
                input: { $filter: { input: '$purchases', as: 'p', cond: { $eq: ['$$p.currency', 'USD'] } } },
                as: 'p',
                in: '$$p.amount',
              },
            },
          },
          BDT: {
            $sum: {
              $map: {
                input: { $filter: { input: '$purchases', as: 'p', cond: { $eq: ['$$p.currency', 'BDT'] } } },
                as: 'p',
                in: '$$p.amount',
              },
            },
          },
        },
      },
    },
    { $sort: { purchase_count: -1 } },
  ]);
};

export const getFeaturePerformance = async (): Promise<any[]> => {
  return Feature.aggregate([
    { $match: { is_deleted: { $ne: true }, is_active: true } },
    {
      $lookup: {
        from: 'featureendpoints',
        localField: '_id',
        foreignField: 'feature',
        as: 'featureEndpoints',
      },
    },
    { $unwind: { path: '$featureEndpoints', preserveNullAndEmptyArrays: true } },
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
                cond: { $and: [{ $ne: ['$$tt.is_deleted', true] }, { $eq: ['$$tt.type', 'decrease'] }] },
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
                    cond: { $and: [{ $ne: ['$$ct.is_deleted', true] }, { $eq: ['$$ct.type', 'decrease'] }] },
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
    { $sort: { usage_count: -1 } },
    { $limit: 10 },
  ]);
};

export const getAiModelUsage = async (): Promise<any[]> => {
  return FeatureUsageLog.aggregate([
    {
      $lookup: {
        from: 'aimodels',
        localField: 'ai_model',
        foreignField: '_id',
        as: 'aiModelData',
      },
    },
    { $unwind: { path: '$aiModelData', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$ai_model',
        model_name: { $first: '$aiModelData.name' },
        provider: { $first: '$aiModelData.provider' },
        usage_count: { $sum: 1 },
        total_tokens_used: { $sum: '$tokens_used' },
        total_credits_charged: { $sum: '$credits_charged' },
      },
    },
    { $sort: { usage_count: -1 } },
    { $limit: 10 },
  ]);
};

export const getPackageAssignmentsByPeriod = async (startDate: Date, endDate: Date): Promise<any[]> => {
  return PackageTransaction.aggregate([
    {
      $match: {
        is_deleted: { $ne: true },
        created_at: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};
