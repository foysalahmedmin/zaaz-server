import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import {
  invalidateCache,
  invalidateCacheByPattern,
  withCache,
} from '../../utils/cache.utils';
import { CreditsProfitHistory } from '../credits-profit-history/credits-profit-history.model';
import { CreditsProfit } from './credits-profit.model';
import { TCreditsProfit } from './credits-profit.type';

const CACHE_TTL = 86400; // 24 hours

export const clearCreditsProfitCache = async () => {
  await invalidateCacheByPattern('credits-profit:*');
};

export const createCreditsProfit = async (
  data: TCreditsProfit,
  session?: mongoose.ClientSession,
): Promise<TCreditsProfit> => {
  const result = await CreditsProfit.create([data], { session });
  await invalidateCache('credits-profit:total-percentage');
  return result[0].toObject();
};

export const getPublicCreditsProfit = async (
  id: string,
): Promise<TCreditsProfit> => {
  const result = await CreditsProfit.findOne({
    _id: id,
    is_active: true,
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }
  return result;
};

export const getCreditsProfit = async (id: string): Promise<TCreditsProfit> => {
  const result = await CreditsProfit.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }
  return result;
};

export const getTotalProfitPercentage = async (): Promise<number> => {
  return await withCache(
    'credits-profit:total-percentage',
    CACHE_TTL,
    async () => {
      const totalPercentageResult = await CreditsProfit.aggregate([
        {
          $match: {
            is_active: true,
            is_deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            totalPercentage: { $sum: '$percentage' },
          },
        },
      ]);
      return totalPercentageResult.length > 0
        ? totalPercentageResult[0].totalPercentage || 0
        : 0;
    },
  );
};

export const getPublicCreditsProfits = async (
  query: Record<string, unknown>,
): Promise<{
  data: TCreditsProfit[];
  meta: { total: number; page: number; limit: number };
}> => {
  const filter: Record<string, unknown> = {
    is_active: true,
  };

  const creditsProfitQuery = new AppAggregationQuery<TCreditsProfit>(
    CreditsProfit,
    {
      ...query,
      ...filter,
    },
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await creditsProfitQuery.execute();

  return result;
};

export const getCreditsProfits = async (
  query: Record<string, unknown>,
): Promise<{
  data: TCreditsProfit[];
  meta: { total: number; page: number; limit: number };
}> => {
  const creditsProfitQuery = new AppAggregationQuery<TCreditsProfit>(
    CreditsProfit,
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await creditsProfitQuery.execute([
    {
      key: 'active',
      filter: { is_active: true },
    },
    {
      key: 'inactive',
      filter: { is_active: false },
    },
  ]);

  return result;
};

export const updateCreditsProfit = async (
  id: string,
  payload: Partial<TCreditsProfit>,
  session?: mongoose.ClientSession,
): Promise<TCreditsProfit> => {
  const creditsProfitData = await CreditsProfit.findById(id).lean();
  if (!creditsProfitData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }

  // Create history before update
  await CreditsProfitHistory.create(
    [
      {
        credits_profit: id,
        name: creditsProfitData.name,
        percentage: creditsProfitData.percentage,
        is_active: creditsProfitData.is_active,
        is_deleted: creditsProfitData.is_deleted,
      },
    ],
    { session },
  );

  const result = await CreditsProfit.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).session(session || null);

  await invalidateCache('credits-profit:total-percentage');

  return result!;
};

export const updateCreditsProfits = async (
  ids: string[],
  payload: Partial<Pick<TCreditsProfit, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const creditsProfits = await CreditsProfit.find({ _id: { $in: ids } }).lean();
  const foundIds = creditsProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await CreditsProfit.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  await invalidateCache('credits-profit:total-percentage');

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteCreditsProfit = async (id: string): Promise<void> => {
  const creditsProfit = await CreditsProfit.findById(id);
  if (!creditsProfit) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }

  await creditsProfit.softDelete();
  await invalidateCache('credits-profit:total-percentage');
};

export const deleteCreditsProfitPermanent = async (
  id: string,
): Promise<void> => {
  const creditsProfit = await CreditsProfit.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!creditsProfit) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit not found');
  }

  await CreditsProfit.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
  await invalidateCache('credits-profit:total-percentage');
};

export const deleteCreditsProfits = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const creditsProfits = await CreditsProfit.find({ _id: { $in: ids } }).lean();
  const foundIds = creditsProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await CreditsProfit.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  await invalidateCache('credits-profit:total-percentage');

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteCreditsProfitsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const creditsProfits = await CreditsProfit.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = creditsProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await CreditsProfit.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  await invalidateCache('credits-profit:total-percentage');

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreCreditsProfit = async (
  id: string,
): Promise<TCreditsProfit> => {
  const creditsProfit = await CreditsProfit.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (creditsProfit) {
    await invalidateCache('credits-profit:total-percentage');
  }

  if (!creditsProfit) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits profit not found or not deleted',
    );
  }

  return creditsProfit;
};

export const restoreCreditsProfits = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await CreditsProfit.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  await invalidateCache('credits-profit:total-percentage');

  const restoredCreditsProfits = await CreditsProfit.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredCreditsProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
