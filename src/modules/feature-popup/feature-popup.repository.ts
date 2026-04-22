import AppAggregationQuery from '../../builder/app-aggregation-query';
import { FeaturePopup } from './feature-popup.model';
import { TFeaturePopup } from './feature-popup.type';
import mongoose from 'mongoose';

export { FeaturePopup };

export const create = async (
  data: Partial<TFeaturePopup>,
): Promise<TFeaturePopup> => {
  const result = await FeaturePopup.create(data);
  return result.toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
  populate = false,
  bypassDeleted = false,
): Promise<TFeaturePopup | null> => {
  const query = FeaturePopup.findById(id);
  if (populate) query.populate('feature');
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
  bypassDeleted = false,
): Promise<TFeaturePopup | null> => {
  const query = FeaturePopup.findOne(filter);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const q = new AppAggregationQuery<TFeaturePopup>(FeaturePopup, {
    ...query,
    ...filter,
  });
  q.populate({ path: 'feature', justOne: true })
    .search(['name', 'value', 'description'])
    .filter()
    .sort(['name', 'category', 'is_active', 'created_at', 'updated_at'] as any)
    .paginate()
    .fields();
  return await q.execute(groups);
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TFeaturePopup>,
): Promise<TFeaturePopup | null> => {
  return await FeaturePopup.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate('feature')
    .lean();
};

export const findByIds = async (
  ids: string[],
  bypassDeleted = false,
): Promise<TFeaturePopup[]> => {
  const query = FeaturePopup.find({ _id: { $in: ids } });
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  const doc = await FeaturePopup.findById(id);
  if (doc) await doc.softDelete();
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await FeaturePopup.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await FeaturePopup.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const permanentDeleteMany = async (ids: string[]): Promise<void> => {
  await FeaturePopup.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TFeaturePopup | null> => {
  return await FeaturePopup.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  )
    .populate('feature')
    .lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await FeaturePopup.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};
