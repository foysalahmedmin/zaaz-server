import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import {
  invalidateCache,
  invalidateCacheByPattern,
  withCache,
} from '../../utils/cache.utils';
import * as CreditsProfitRepository from './credits-profit.repository';
import { TCreditsProfit } from './credits-profit.type';

const CACHE_TTL = 86400;
const TOTAL_PERCENTAGE_KEY = 'credits-profit:total-percentage';

export const clearCreditsProfitCache = async () => {
  await invalidateCacheByPattern('credits-profit:*');
};

export const createCreditsProfit = async (
  data: TCreditsProfit,
  session?: mongoose.ClientSession,
): Promise<TCreditsProfit> => {
  const result = await CreditsProfitRepository.create(data, session);
  await invalidateCache(TOTAL_PERCENTAGE_KEY);
  return result;
};

export const getPublicCreditsProfit = async (
  id: string,
): Promise<TCreditsProfit> => {
  const result = await CreditsProfitRepository.findOne({
    _id: id,
    is_active: true,
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }
  return result;
};

export const getCreditsProfit = async (id: string): Promise<TCreditsProfit> => {
  const result = await CreditsProfitRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }
  return result;
};

export const getTotalProfitPercentage = async (): Promise<number> => {
  return await withCache(TOTAL_PERCENTAGE_KEY, CACHE_TTL, () =>
    CreditsProfitRepository.getTotalProfitPercentage(),
  );
};

export const getPublicCreditsProfits = async (
  query: Record<string, unknown>,
): Promise<{ data: TCreditsProfit[]; meta: any }> => {
  return await CreditsProfitRepository.findPaginated(query, { is_active: true });
};

export const getCreditsProfits = async (
  query: Record<string, unknown>,
): Promise<{ data: TCreditsProfit[]; meta: any }> => {
  return await CreditsProfitRepository.findPaginatedWithGroups(query);
};

export const updateCreditsProfit = async (
  id: string,
  payload: Partial<TCreditsProfit>,
  session?: mongoose.ClientSession,
): Promise<TCreditsProfit> => {
  const existing = await CreditsProfitRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }

  await CreditsProfitRepository.createHistory(
    id,
    {
      name: existing.name,
      percentage: existing.percentage,
      is_active: existing.is_active,
      is_deleted: existing.is_deleted,
    },
    session,
  );

  const result = await CreditsProfitRepository.updateById(id, payload, session);
  await invalidateCache(TOTAL_PERCENTAGE_KEY);
  return result!;
};

export const updateCreditsProfits = async (
  ids: string[],
  payload: Partial<Pick<TCreditsProfit, 'is_active'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await CreditsProfitRepository.findByIds(ids);
  const foundIds = existing.map((p) => (p as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  const result = await CreditsProfitRepository.updateMany(
    { _id: { $in: foundIds } },
    payload,
  );
  await invalidateCache(TOTAL_PERCENTAGE_KEY);

  return { count: result.modifiedCount, not_found_ids };
};

export const deleteCreditsProfit = async (id: string): Promise<void> => {
  const existing = await CreditsProfitRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }
  await CreditsProfitRepository.softDeleteById(id);
  await invalidateCache(TOTAL_PERCENTAGE_KEY);
};

export const deleteCreditsProfitPermanent = async (
  id: string,
): Promise<void> => {
  const existing = await CreditsProfitRepository.findByIds([id], true);
  if (!existing.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }
  await CreditsProfitRepository.permanentDeleteById(id);
  await invalidateCache(TOTAL_PERCENTAGE_KEY);
};

export const deleteCreditsProfits = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await CreditsProfitRepository.findByIds(ids);
  const foundIds = existing.map((p) => (p as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  const count = await CreditsProfitRepository.softDeleteMany(foundIds);
  await invalidateCache(TOTAL_PERCENTAGE_KEY);

  return { count, not_found_ids };
};

export const deleteCreditsProfitsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await CreditsProfitRepository.findByIds(ids, true);
  const deletable = existing.filter((p: any) => p.is_deleted);
  const foundIds = deletable.map((p: any) => p._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  const count = await CreditsProfitRepository.permanentDeleteMany(foundIds);
  await invalidateCache(TOTAL_PERCENTAGE_KEY);

  return { count, not_found_ids };
};

export const restoreCreditsProfit = async (
  id: string,
): Promise<TCreditsProfit> => {
  const result = await CreditsProfitRepository.restore(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits profit not found or not deleted',
    );
  }
  await invalidateCache(TOTAL_PERCENTAGE_KEY);
  return result;
};

export const restoreCreditsProfits = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await CreditsProfitRepository.restoreMany(ids);
  await invalidateCache(TOTAL_PERCENTAGE_KEY);

  const restored = await CreditsProfitRepository.findByIds(ids);
  const restoredIds = restored.map((p: any) => p._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  return { count: result.modifiedCount, not_found_ids };
};
