import httpStatus from 'http-status';
import AppAggregationQuery from '../../builder/app-aggregation-query';
import AppError from '../../builder/app-error';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import * as IntervalRepository from './interval.repository';
import { TInterval } from './interval.type';

const CACHE_TTL = 86400;

const clearIntervalCache = async () => {
  await invalidateCacheByPattern('interval:*');
  await invalidateCacheByPattern('intervals:*');
};

export const createInterval = async (data: TInterval): Promise<TInterval> => {
  const result = await IntervalRepository.Interval.create([data]);
  await clearIntervalCache();
  return result[0];
};

export const getInterval = async (id: string): Promise<TInterval> => {
  return withCache(`interval:${id}`, CACHE_TTL, async () => {
    const result = await IntervalRepository.findById(id);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Interval not found');
    }
    return result;
  });
};

export const getIntervals = async (
  query: Record<string, unknown>,
): Promise<{
  data: TInterval[];
  meta: { total: number; page: number; limit: number };
}> => {
  return withCache(`intervals:${JSON.stringify(query)}`, CACHE_TTL, async () => {
    const { ...rest } = query;

    const filter: Record<string, unknown> = {};

    const intervalQuery = new AppAggregationQuery<TInterval>(IntervalRepository.Interval, {
      ...rest,
      ...filter,
    })
      .search(['name', 'description'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await intervalQuery.execute([
      { key: 'active', filter: { is_active: true } },
      { key: 'inactive', filter: { is_active: false } },
    ]);

    return result;
  });
};

export const updateInterval = async (
  id: string,
  payload: Partial<TInterval>,
): Promise<TInterval> => {
  const data = await IntervalRepository.findById(id);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Interval not found');
  }

  const result = await IntervalRepository.Interval.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  await clearIntervalCache();
  return result!;
};

export const updateIntervals = async (
  ids: string[],
  payload: Partial<Pick<TInterval, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const intervals = await IntervalRepository.Interval.find({ _id: { $in: ids } }).lean();
  const foundIds = intervals.map((interval) => interval._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await IntervalRepository.Interval.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  await clearIntervalCache();
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const deleteInterval = async (id: string): Promise<void> => {
  await IntervalRepository.softDelete(id);
  await clearIntervalCache();
};

export const deleteIntervalPermanent = async (id: string): Promise<void> => {
  const interval = await IntervalRepository.Interval.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!interval) {
    throw new AppError(httpStatus.NOT_FOUND, 'Interval not found');
  }

  await IntervalRepository.Interval.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
  await clearIntervalCache();
};

export const deleteIntervals = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const intervals = await IntervalRepository.Interval.find({ _id: { $in: ids } }).lean();
  const foundIds = intervals.map((interval) => interval._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await IntervalRepository.Interval.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  await clearIntervalCache();
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteIntervalsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const intervals = await IntervalRepository.Interval.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = intervals.map((interval) => interval._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await IntervalRepository.Interval.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  await clearIntervalCache();
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restoreInterval = async (id: string): Promise<TInterval> => {
  const interval = await IntervalRepository.Interval.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!interval) {
    throw new AppError(httpStatus.NOT_FOUND, 'Interval not found or not deleted');
  }

  await clearIntervalCache();
  return interval;
};

export const restoreIntervals = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await IntervalRepository.Interval.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredIntervals = await IntervalRepository.Interval.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredIntervals.map((interval) => interval._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  await clearIntervalCache();
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
