import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { PackageHistory } from './package-history.model';
import { TPackageHistory } from './package-history.type';

export { PackageHistory };

export const findPaginated = async (
  packageId: string,
  query: Record<string, unknown> = {},
): Promise<any> => {
  const q = new AppAggregationQuery<TPackageHistory>(PackageHistory, query);
  q.pipeline([{ $match: { package: new mongoose.Types.ObjectId(packageId) } }]);
  q.populate([{ path: 'package', justOne: true }, { path: 'features' }]).sort().paginate().fields();
  return await q.execute();
};

export const findById = async (id: string): Promise<TPackageHistory | null> => {
  return await PackageHistory.findById(id).populate([{ path: 'package' }, { path: 'features' }]);
};

export const findMany = async (filter: Record<string, unknown>): Promise<TPackageHistory[]> => {
  return await PackageHistory.find(filter).lean();
};

export const softDeleteById = async (id: string): Promise<void> => {
  await PackageHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await PackageHistory.findByIdAndDelete(id);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await PackageHistory.updateMany(filter, update);
};

export const permanentDeleteMany = async (filter: Record<string, unknown>): Promise<void> => {
  await PackageHistory.deleteMany(filter).setOptions({ bypassDeleted: true });
};

export const findOneAndRestore = async (
  filter: Record<string, unknown>,
): Promise<TPackageHistory | null> => {
  return await PackageHistory.findOneAndUpdate(
    filter,
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  filter: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await PackageHistory.updateMany(filter, { is_deleted: false });
};
