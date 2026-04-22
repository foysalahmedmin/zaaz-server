import AppAggregationQuery from '../../builder/app-aggregation-query';
import { Feature } from './feature.model';
import { TFeature } from './feature.type';
import mongoose from 'mongoose';

export { Feature };

export const create = async (data: TFeature): Promise<TFeature> => {
  const result = await Feature.create(data);
  return result.toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
  populate = false,
): Promise<TFeature | null> => {
  const query = Feature.findById(id);
  if (populate) query.populate('children');
  return await query.lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
  populate = false,
  bypassDeleted = false,
): Promise<TFeature | null> => {
  const query = Feature.findOne(filter);
  if (populate) query.populate('children');
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  sortFields?: string[],
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const q = new AppAggregationQuery<TFeature>(Feature, { ...query, ...filter });
  q.populate([{ path: 'children' }])
    .search(['name', 'value', 'description', 'path'])
    .filter()
    .sort((sortFields || []) as any)
    .paginate()
    .fields();
  return await q.execute(groups);
};

export const findPaginatedWithLookups = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown>,
  lookupPipelines: any[],
): Promise<any> => {
  const q = new AppAggregationQuery(Feature, { ...query, ...filter });
  q.addPipeline(lookupPipelines)
    .search(['name', 'value', 'description', 'path'])
    .filter()
    .sort()
    .paginate()
    .fields();
  return await q.execute();
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TFeature>,
): Promise<TFeature | null> => {
  return await Feature.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Partial<TFeature>,
): Promise<{ modifiedCount: number }> => {
  return await Feature.updateMany(filter, update);
};

export const findByIds = async (
  ids: string[],
  bypassDeleted = false,
): Promise<TFeature[]> => {
  const query = Feature.find({ _id: { $in: ids } });
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  const doc = await Feature.findById(id);
  if (doc) await doc.softDelete();
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await Feature.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await Feature.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const permanentDeleteMany = async (ids: string[]): Promise<void> => {
  await Feature.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TFeature | null> => {
  return await Feature.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await Feature.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};
