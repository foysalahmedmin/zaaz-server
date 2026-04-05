/**
 * User Repository
 *
 * Handles ALL direct database interactions for the User module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { User } from './user.model';
import { TUser } from './user.type';

// ─── Find One ────────────────────────────────────────────────────────────────

export const findById = async (id: string): Promise<TUser | null> => {
  return await User.findById(id).lean();
};

export const findByEmail = async (email: string): Promise<TUser | null> => {
  return await User.findOne({ email }).lean();
};

export const findByIdForUpdate = async (id: string) => {
  return await User.findById(id);
};

export const findByIdWithDeleted = async (id: string): Promise<TUser | null> => {
  return await User.findById(id).setOptions({ bypassDeleted: true }).lean();
};

// ─── Find Many ────────────────────────────────────────────────────────────────

export const findMany = async (ids: string[]): Promise<TUser[]> => {
  return await User.find({ _id: { $in: ids } }).lean();
};

export const findManyWithDeleted = async (ids: string[]): Promise<TUser[]> => {
  return await User.find({ _id: { $in: ids } })
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TUser[];
  meta: { total: number; page: number; limit: number };
}> => {
  const userQuery = new AppAggregationQuery<TUser>(User, query)
    .search(['name', 'email', 'image'])
    .filter()
    .sort([
      'name',
      'email',
      'role',
      'status',
      'created_at',
      'updated_at',
    ] as any)
    .paginate()
    .fields();

  return await userQuery.execute([
    { key: 'in-progress', filter: { status: 'in-progress' } },
    { key: 'blocked', filter: { status: 'blocked' } },
    { key: 'admin', filter: { role: 'admin' } },
  ]);
};

export const findWritersPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TUser[];
  meta: { total: number; page: number; limit: number };
}> => {
  const userQuery = new AppAggregationQuery<TUser>(User, query);
  userQuery.pipeline([{ $match: { role: { $in: ['admin', 'author'] } } }]);
  userQuery.search(['name', 'email']).filter().sort().paginate().fields();

  return await userQuery.execute();
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateById = async (
  id: string,
  payload: Record<string, any>,
): Promise<TUser | null> => {
  return await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateManyByIds = async (
  ids: string[],
  payload: Record<string, any>,
): Promise<{ modifiedCount: number }> => {
  const result = await User.updateMany({ _id: { $in: ids } }, payload);
  return { modifiedCount: result.modifiedCount };
};

export const restoreById = async (id: string): Promise<TUser | null> => {
  return await User.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );
};

export const restoreManyByIds = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  const result = await User.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
  return { modifiedCount: result.modifiedCount };
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const softDeleteById = async (id: string): Promise<void> => {
  const user = await User.findById(id);
  if (user) {
    await user.softDelete();
  }
};

export const softDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await User.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await User.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const hardDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await User.deleteMany({ _id: { $in: ids } }).setOptions({
    bypassDeleted: true,
  });
};
