import AppAggregationQuery from '../../builder/app-aggregation-query';
import { FeatureFeedback } from './feature-feedback.model';
import { TFeatureFeedback } from './feature-feedback.type';
import mongoose from 'mongoose';

export { FeatureFeedback };

export const create = async (data: TFeatureFeedback): Promise<TFeatureFeedback> => {
  const result = await FeatureFeedback.create(data);
  return result.toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TFeatureFeedback | null> => {
  return await FeatureFeedback.findById(id).lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
): Promise<any> => {
  return await new AppAggregationQuery<TFeatureFeedback>(FeatureFeedback, query)
    .populate([
      { path: 'user', select: 'name email image' },
      { path: 'feature', select: 'name value' },
    ])
    .search(['comment', 'category', 'status'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TFeatureFeedback>,
): Promise<TFeatureFeedback | null> => {
  return await FeatureFeedback.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  const doc = await FeatureFeedback.findById(id);
  if (doc) await doc.softDelete();
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await FeatureFeedback.updateMany(
    { _id: { $in: ids } },
    { is_deleted: true },
  );
};

export const updateManyStatus = async (
  ids: string[],
  status: string,
): Promise<void> => {
  await FeatureFeedback.updateMany({ _id: { $in: ids } }, { status });
};
