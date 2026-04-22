import AppAggregationQuery from '../../builder/app-aggregation-query';
import { FeatureEndpoint } from './feature-endpoint.model';
import { TFeatureEndpoint } from './feature-endpoint.type';
import mongoose from 'mongoose';

export { FeatureEndpoint };

export const create = async (data: TFeatureEndpoint): Promise<TFeatureEndpoint> => {
  const result = await FeatureEndpoint.create(data);
  return result.toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
  populate = false,
): Promise<TFeatureEndpoint | null> => {
  const query = FeatureEndpoint.findById(id);
  if (populate) query.populate('feature');
  return await query.lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
  populate = false,
  bypassDeleted = false,
): Promise<TFeatureEndpoint | null> => {
  const query = FeatureEndpoint.findOne(filter);
  if (populate) query.populate('feature');
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const q = new AppAggregationQuery<TFeatureEndpoint>(FeatureEndpoint, {
    ...query,
    ...filter,
  });
  q.populate([{ path: 'feature', justOne: true }])
    .search(['name', 'value', 'endpoint', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();
  return await q.execute(groups);
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TFeatureEndpoint>,
): Promise<TFeatureEndpoint | null> => {
  return await FeatureEndpoint.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Partial<TFeatureEndpoint>,
): Promise<{ modifiedCount: number }> => {
  return await FeatureEndpoint.updateMany(filter, update);
};

export const findByIds = async (
  ids: string[],
  bypassDeleted = false,
): Promise<TFeatureEndpoint[]> => {
  const query = FeatureEndpoint.find({ _id: { $in: ids } });
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  const doc = await FeatureEndpoint.findById(id);
  if (doc) await doc.softDelete();
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await FeatureEndpoint.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await FeatureEndpoint.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const permanentDeleteMany = async (ids: string[]): Promise<void> => {
  await FeatureEndpoint.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TFeatureEndpoint | null> => {
  return await FeatureEndpoint.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await FeatureEndpoint.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};
