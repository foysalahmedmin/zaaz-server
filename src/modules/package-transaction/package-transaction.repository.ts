import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { PackageTransaction } from './package-transaction.model';
import { TPackageTransaction } from './package-transaction.type';

export { PackageTransaction };

export const create = async (
  data: TPackageTransaction,
  session?: mongoose.ClientSession,
): Promise<TPackageTransaction> => {
  const result = await PackageTransaction.create([data], { session });
  return result[0].toObject();
};

export const findById = async (
  id: string,
  bypassDeleted = false,
): Promise<TPackageTransaction | null> => {
  const query = PackageTransaction.findById(id);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const findByIdPopulated = async (id: string): Promise<TPackageTransaction | null> => {
  return await PackageTransaction.findById(id).populate([
    'package',
    'interval',
    'user',
    'user_wallet',
    'payment_transaction',
  ]);
};

export const findMany = async (filter: Record<string, unknown>): Promise<TPackageTransaction[]> => {
  return await PackageTransaction.find(filter).lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const q = new AppAggregationQuery<TPackageTransaction>(PackageTransaction, {
    ...query,
    ...filter,
  });
  q.populate([
    { path: 'package', justOne: true },
    { path: 'interval', justOne: true },
    { path: 'user', select: 'name email', justOne: true },
  ])
    .search(['email'])
    .filter()
    .sort(['created_at', 'updated_at'] as any)
    .paginate()
    .fields();
  return await q.execute(groups);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await PackageTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await PackageTransaction.findByIdAndDelete(id);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await PackageTransaction.updateMany(filter, update);
};

export const permanentDeleteMany = async (filter: Record<string, unknown>): Promise<void> => {
  await PackageTransaction.deleteMany(filter).setOptions({ bypassDeleted: true });
};

export const findOneAndRestore = async (
  filter: Record<string, unknown>,
): Promise<TPackageTransaction | null> => {
  return await PackageTransaction.findOneAndUpdate(
    filter,
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  filter: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await PackageTransaction.updateMany(filter, { is_deleted: false });
};
