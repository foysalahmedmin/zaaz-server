import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import * as CreditsUsageRepository from './credits-usage.repository';
import { TCreditsUsage } from './credits-usage.type';

/**
 * Create a new credits usage log
 */
export const createCreditsUsage = async (
  payload: TCreditsUsage,
  session?: mongoose.ClientSession,
): Promise<TCreditsUsage> => {
  return await CreditsUsageRepository.create(payload, session);
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

  const [result, aggregateStats] = await Promise.all([
    CreditsUsageRepository.findPaginated(rest, filter),
    CreditsUsageRepository.getAggregateStats(filter),
  ]);

  if (Object.keys(aggregateStats).length > 0) {
    result.meta.statistics = {
      ...result.meta.statistics,
      total_cost_credits: aggregateStats.total_cost_credits || 0,
      total_profit: aggregateStats.total_profit || 0,
      total_rounding: aggregateStats.total_rounding || 0,
      total_credits: aggregateStats.total_credits || 0,
      total_price: aggregateStats.total_price || 0,
      total_input_tokens: aggregateStats.total_input_tokens || 0,
      total_output_tokens: aggregateStats.total_output_tokens || 0,
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
  const result = await CreditsUsageRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits usage log not found');
  }
  return result;
};

/**
 * Soft delete credits usage log
 */
export const deleteCreditsUsage = async (id: string): Promise<void> => {
  const log = await CreditsUsageRepository.findById(id);
  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits usage log not found');
  }

  await CreditsUsageRepository.softDelete(id);
};

/**
 * Get credits usage logs by usage_key
 */
export const getCreditsUsagesByUsageKey = async (
  usage_key: string,
): Promise<TCreditsUsage[]> => {
  return await CreditsUsageRepository.findByUsageKey(usage_key);
};




