/**
 * Credits Usage Repository
 *
 * Handles direct database interactions for the Credits Usage module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { CreditsUsage } from './credits-usage.model';
import { TCreditsUsage } from './credits-usage.type';
import mongoose from 'mongoose';

export { CreditsUsage };

/**
 * Create a new credits usage log.
 */
export const create = async (
  payload: TCreditsUsage,
  session?: mongoose.ClientSession,
): Promise<TCreditsUsage> => {
  const result = await CreditsUsage.create([payload], { session });
  return result[0].toObject();
};

/**
 * Get all credits usage logs with pagination and filtering.
 */
export const findPaginated = async (
  query_params: Record<string, unknown>,
  filter: Record<string, any>
): Promise<any> => {
  const appQuery = new AppAggregationQuery(CreditsUsage, query_params);

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

  return await appQuery.execute();
};

/**
 * Get aggregate statistics for credits usages.
 */
export const getAggregateStats = async (filter: Record<string, any> = {}): Promise<any> => {
  const result = await CreditsUsage.aggregate([
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
  ]);
  return result[0] || {};
};

/**
 * Find single credits usage log by ID.
 */
export const findById = async (id: string | mongoose.Types.ObjectId): Promise<TCreditsUsage | null> => {
  return await CreditsUsage.findById(id)
    .populate(['user_wallet', 'credits_transaction'])
    .select('+profit_credits +cost_credits +cost_price')
    .lean();
};

/**
 * Soft delete credits usage log.
 */
export const softDelete = async (id: string | mongoose.Types.ObjectId): Promise<void> => {
  await CreditsUsage.findByIdAndUpdate(id, { is_deleted: true });
};

/**
 * Find credits usage logs by usage_key.
 */
export const findByUsageKey = async (usage_key: string): Promise<TCreditsUsage[]> => {
  return await CreditsUsage.find({
    usage_key,
    is_deleted: { $ne: true },
  })
    .populate(['user_wallet', 'credits_transaction'])
    .select('+profit_credits +cost_credits +cost_price +rounding_credits +rounding_price')
    .lean();
};
