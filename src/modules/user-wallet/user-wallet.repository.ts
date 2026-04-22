import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { UserWallet } from './user-wallet.model';
import { TUserWallet } from './user-wallet.type';

export { UserWallet };

export const findOne = async (
  filter: Record<string, unknown>,
  session?: mongoose.ClientSession,
  options?: { virtuals?: boolean; select?: string },
): Promise<TUserWallet | null> => {
  let query = UserWallet.findOne(filter).session(session || null);
  if (options?.select) query = query.select(options.select) as any;
  return await query.lean({ virtuals: options?.virtuals });
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
  session?: mongoose.ClientSession,
  bypassDeleted = false,
): Promise<TUserWallet | null> => {
  const query = UserWallet.findById(id).session(session || null);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const create = async (
  data: Partial<TUserWallet>,
  session?: mongoose.ClientSession,
): Promise<TUserWallet> => {
  const result = await UserWallet.create([data], { session });
  return result[0].toObject();
};

export const findByIdAndUpdate = async (
  id: string | mongoose.Types.ObjectId,
  update: Record<string, unknown>,
  session?: mongoose.ClientSession,
): Promise<TUserWallet | null> => {
  return await UserWallet.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).session(session || null);
};

export const findOneAndUpdate = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
  session?: mongoose.ClientSession,
): Promise<(TUserWallet & { _id: mongoose.Types.ObjectId }) | null> => {
  return await UserWallet.findOneAndUpdate(filter, update, {
    new: true,
    runValidators: true,
  }).session(session || null) as any;
};

export const updateOne = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await UserWallet.updateOne(filter, update);
};

export const findMany = async (
  filter: Record<string, unknown>,
): Promise<TUserWallet[]> => {
  return await UserWallet.find(filter).lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const q = new AppAggregationQuery<TUserWallet>(UserWallet, { ...query, ...filter });
  q.populate([
    { path: 'package', justOne: true },
    { path: 'interval', justOne: true },
  ])
    .search(['email'])
    .filter()
    .sort(['credits', 'created_at', 'updated_at'] as any)
    .paginate()
    .fields();
  return await q.execute(groups);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await UserWallet.updateMany(filter, update);
};

export const deleteMany = async (
  filter: Record<string, unknown>,
  bypassDeleted = false,
): Promise<void> => {
  const query = UserWallet.deleteMany(filter);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  await query;
};

export const findOneAndRestore = async (
  filter: Record<string, unknown>,
): Promise<TUserWallet | null> => {
  return await UserWallet.findOneAndUpdate(filter, { is_deleted: false }, { new: true }).lean();
};

export const restoreMany = async (
  filter: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await UserWallet.updateMany(filter, { is_deleted: false });
};
