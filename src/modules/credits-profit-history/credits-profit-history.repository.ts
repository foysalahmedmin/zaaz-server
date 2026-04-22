import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { CreditsProfitHistory } from './credits-profit-history.model';
import { TCreditsProfitHistory } from './credits-profit-history.type';

export { CreditsProfitHistory };

export const findPaginated = async (
  creditsProfitId: string,
  query: Record<string, unknown> = {},
): Promise<any> => {
  const q = new AppAggregationQuery<TCreditsProfitHistory>(CreditsProfitHistory, query);
  q.pipeline([{ $match: { credits_profit: new mongoose.Types.ObjectId(creditsProfitId) } }]);
  q.populate([{ path: 'credits_profit', justOne: true }]).sort().paginate().fields();
  return await q.execute();
};

export const findById = async (id: string): Promise<TCreditsProfitHistory | null> => {
  return await CreditsProfitHistory.findById(id).populate([{ path: 'credits_profit' }]);
};

export const findMany = async (
  filter: Record<string, unknown>,
): Promise<TCreditsProfitHistory[]> => {
  return await CreditsProfitHistory.find(filter).lean();
};

export const softDeleteById = async (id: string): Promise<void> => {
  await CreditsProfitHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await CreditsProfitHistory.findByIdAndDelete(id);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await CreditsProfitHistory.updateMany(filter, update);
};

export const permanentDeleteMany = async (filter: Record<string, unknown>): Promise<void> => {
  await CreditsProfitHistory.deleteMany(filter).setOptions({ bypassDeleted: true });
};

export const findOneAndRestore = async (
  filter: Record<string, unknown>,
): Promise<TCreditsProfitHistory | null> => {
  return await CreditsProfitHistory.findOneAndUpdate(
    filter,
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  filter: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await CreditsProfitHistory.updateMany(filter, { is_deleted: false });
};
