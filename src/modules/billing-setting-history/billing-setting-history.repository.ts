import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { BillingSettingHistory } from './billing-setting-history.model';
import { TBillingSettingHistory } from './billing-setting-history.type';

export { BillingSettingHistory };

export const findPaginated = async (
  billingSettingId: string,
  query: Record<string, unknown> = {},
): Promise<any> => {
  const q = new AppAggregationQuery<TBillingSettingHistory>(BillingSettingHistory, query);
  q.pipeline([{ $match: { billing_setting: new mongoose.Types.ObjectId(billingSettingId) } }]);
  q.populate([{ path: 'billing_setting', justOne: true }]).sort().paginate().fields();
  return await q.execute();
};

export const findById = async (id: string): Promise<TBillingSettingHistory | null> => {
  return await BillingSettingHistory.findById(id).populate([{ path: 'billing_setting' }]);
};

export const findMany = async (
  filter: Record<string, unknown>,
): Promise<TBillingSettingHistory[]> => {
  return await BillingSettingHistory.find(filter).lean();
};

export const softDeleteById = async (id: string): Promise<void> => {
  await BillingSettingHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await BillingSettingHistory.findByIdAndDelete(id);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await BillingSettingHistory.updateMany(filter, update);
};

export const permanentDeleteMany = async (filter: Record<string, unknown>): Promise<void> => {
  await BillingSettingHistory.deleteMany(filter).setOptions({ bypassDeleted: true });
};

export const findOneAndRestore = async (
  filter: Record<string, unknown>,
): Promise<TBillingSettingHistory | null> => {
  return await BillingSettingHistory.findOneAndUpdate(
    filter,
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  filter: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await BillingSettingHistory.updateMany(filter, { is_deleted: false });
};
