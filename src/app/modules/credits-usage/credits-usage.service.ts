import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppQueryAggregation from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { CreditsUsage } from './credits-usage.model';
import { TCreditsUsage } from './credits-usage.type';

/**
 * Create a new credits usage log
 */
export const createCreditsUsage = async (
  payload: TCreditsUsage,
  session?: mongoose.ClientSession,
): Promise<TCreditsUsage> => {
  const result = await CreditsUsage.create([payload], { session });
  return result[0];
};

/**
 * Get all credits usage logs with pagination and filtering
 */
export const getCreditsUsages = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TCreditsUsage[]; meta: any }> => {
  const { gte, lte, ...rest } = query_params;

  const filter: Record<string, any> = { is_deleted: { $ne: true } };

  // Date range filter
  if (gte || lte) {
    filter.created_at = {};
    if (gte) {
      filter.created_at.$gte = new Date(gte as string);
    }
    if (lte) {
      filter.created_at.$lte = new Date(lte as string);
    }
  }

  const appQuery = new AppQueryAggregation(CreditsUsage, rest);

  if (Object.keys(filter).length > 0) {
    appQuery.pipeline([{ $match: filter }]);
  }

  appQuery
    .populate([
      { path: 'user_wallet', select: 'credits', justOne: true },
      { path: 'credits_transaction', justOne: true },
    ])
    .search(['email', 'usage_key', 'ai_model'])
    .filter()
    .sort(['created_at', 'total_uses_credits'] as any)
    .paginate()
    .fields();

  const [result, aggregateStats] = await Promise.all([
    appQuery.execute(),
    CreditsUsage.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_cost_credits: { $sum: '$cost_credits' },
          total_profit: { $sum: '$profit_credits' },
          total_rounding: { $sum: '$rounding_credits' },
          total_credits: { $sum: '$credits' },
          total_price: { $sum: '$price' },
          total_input_tokens: { $sum: '$input_tokens' },
          total_output_tokens: { $sum: '$output_tokens' },
        },
      },
    ]),
  ]);

  if (aggregateStats.length > 0) {
    result.meta.statistics = {
      ...result.meta.statistics,
      total_cost_credits: aggregateStats[0].total_cost_credits || 0,
      total_profit: aggregateStats[0].total_profit || 0,
      total_rounding: aggregateStats[0].total_rounding || 0,
      total_credits: aggregateStats[0].total_credits || 0,
      total_price: aggregateStats[0].total_price || 0,
      total_input_tokens: aggregateStats[0].total_input_tokens || 0,
      total_output_tokens: aggregateStats[0].total_output_tokens || 0,
    };
  }

  return result;
};

/**
 * Get single credits usage log by ID
 */
export const getCreditsUsageById = async (
  id: string,
): Promise<TCreditsUsage> => {
  const result = await CreditsUsage.findById(id)
    .populate(['user_wallet', 'credits_transaction'])
    .select('+profit_credits +cost_credits +cost_price');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits usage log not found');
  }
  return result;
};

/**
 * Soft delete credits usage log
 */
export const deleteCreditsUsage = async (id: string): Promise<void> => {
  const log = await CreditsUsage.findById(id).lean();
  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits usage log not found');
  }

  await CreditsUsage.findByIdAndUpdate(id, { is_deleted: true });
};

/**
 * Get credits usage logs by usage_key
 */
export const getCreditsUsagesByUsageKey = async (
  usage_key: string,
): Promise<TCreditsUsage[]> => {
  const result = await CreditsUsage.find({
    usage_key,
    is_deleted: { $ne: true },
  })
    .populate(['user_wallet', 'credits_transaction'])
    .select(
      '+profit_credits +cost_credits +cost_price +rounding_credits +rounding_price',
    );
  return result;
};
