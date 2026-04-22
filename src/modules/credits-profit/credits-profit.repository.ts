import AppAggregationQuery from '../../builder/app-aggregation-query';
import { CreditsProfitHistory } from '../credits-profit-history/credits-profit-history.model';
import { CreditsProfit } from './credits-profit.model';
import { TCreditsProfit } from './credits-profit.type';
import mongoose from 'mongoose';

export { CreditsProfit };

export const create = async (
  data: TCreditsProfit,
  session?: mongoose.ClientSession,
): Promise<TCreditsProfit> => {
  const result = await CreditsProfit.create([data], { session });
  return result[0].toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TCreditsProfit | null> => {
  return await CreditsProfit.findById(id).lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
): Promise<TCreditsProfit | null> => {
  return await CreditsProfit.findOne(filter).lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
): Promise<any> => {
  return await new AppAggregationQuery<TCreditsProfit>(CreditsProfit, {
    ...query,
    ...filter,
  })
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();
};

export const findPaginatedWithGroups = async (
  query: Record<string, unknown>,
): Promise<any> => {
  return await new AppAggregationQuery<TCreditsProfit>(CreditsProfit, query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute([
      { key: 'active', filter: { is_active: true } },
      { key: 'inactive', filter: { is_active: false } },
    ]);
};

export const getTotalProfitPercentage = async (): Promise<number> => {
  const result = await CreditsProfit.aggregate([
    { $match: { is_active: true, is_deleted: { $ne: true } } },
    { $group: { _id: null, totalPercentage: { $sum: '$percentage' } } },
  ]);
  return result.length > 0 ? result[0].totalPercentage || 0 : 0;
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TCreditsProfit>,
  session?: mongoose.ClientSession,
): Promise<TCreditsProfit | null> => {
  return await CreditsProfit.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    session: session || null,
  }).lean();
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Partial<TCreditsProfit>,
): Promise<{ modifiedCount: number }> => {
  return await CreditsProfit.updateMany(filter, update);
};

export const findByIds = async (
  ids: string[],
  bypassDeleted = false,
): Promise<TCreditsProfit[]> => {
  const query = CreditsProfit.find({ _id: { $in: ids } });
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  const doc = await CreditsProfit.findById(id);
  if (doc) await doc.softDelete();
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await CreditsProfit.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const softDeleteMany = async (ids: string[]): Promise<number> => {
  const result = await CreditsProfit.updateMany(
    { _id: { $in: ids } },
    { is_deleted: true },
  );
  return result.modifiedCount;
};

export const permanentDeleteMany = async (ids: string[]): Promise<number> => {
  const result = await CreditsProfit.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
  return result.deletedCount;
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TCreditsProfit | null> => {
  return await CreditsProfit.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await CreditsProfit.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};

export const createHistory = async (
  creditsProfitId: string,
  data: Pick<TCreditsProfit, 'name' | 'percentage' | 'is_active' | 'is_deleted'>,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await CreditsProfitHistory.create(
    [{ credits_profit: creditsProfitId, ...data }],
    { session },
  );
};
