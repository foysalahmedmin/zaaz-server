import AppAggregationQuery from '../../builder/app-aggregation-query';
import { Interval } from './interval.model';
import { TInterval } from './interval.type';
import mongoose from 'mongoose';

export { Interval };

export const findById = async (id: string | mongoose.Types.ObjectId): Promise<TInterval | null> => {
  return await Interval.findById(id).lean();
};

export const findActive = async (): Promise<TInterval[]> => {
  return await Interval.find({ is_active: true, is_deleted: false }).sort({ order: 1 }).lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TInterval[];
  meta: { total: number; page: number; limit: number };
}> => {
  const appQuery = new AppAggregationQuery<TInterval>(Interval, query)
    .search(['name', 'description'])
    .filter()
    .sort(['order', 'created_at'] as any)
    .paginate()
    .fields();

  return await appQuery.execute();
};

export const create = async (payload: Partial<TInterval>): Promise<TInterval> => {
  const result = await Interval.create(payload);
  return result.toObject();
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TInterval>,
): Promise<TInterval | null> => {
  return await Interval.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
};

export const softDelete = async (id: string | mongoose.Types.ObjectId): Promise<TInterval | null> => {
  return await Interval.findByIdAndUpdate(id, { is_deleted: true }, { new: true }).lean();
};
