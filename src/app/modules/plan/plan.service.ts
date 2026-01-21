import httpStatus from 'http-status';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import { Plan } from './plan.model';
import { TPlan } from './plan.type';

const CACHE_TTL = 86400; // 24 hours (Optimized for production with proper invalidation)

const clearPlanCache = async () => {
  await invalidateCacheByPattern('plan:*');
  await invalidateCacheByPattern('plans:*');
};

export const createPlan = async (data: TPlan): Promise<TPlan> => {
  const result = await Plan.create([data]);

  // Clear cache after creation
  await clearPlanCache();

  return result[0].toObject();
};

export const getPlan = async (id: string): Promise<TPlan> => {
  return withCache(`plan:${id}`, CACHE_TTL, async () => {
    const result = await Plan.findById(id).lean();
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
    }
    return result;
  });
};

export const getPlans = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPlan[];
  meta: { total: number; page: number; limit: number };
}> => {
  return withCache(`plans:${JSON.stringify(query)}`, CACHE_TTL, async () => {
    const { ...rest } = query;

    const filter: Record<string, unknown> = {};

    const planQuery = new AppAggregationQuery<TPlan>(Plan, {
      ...rest,
      ...filter,
    })
      .search(['name', 'description'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await planQuery.execute([
      {
        key: 'active',
        filter: { is_active: true },
      },
      {
        key: 'inactive',
        filter: { is_active: false },
      },
    ]);

    return result;
  });
};

export const updatePlan = async (
  id: string,
  payload: Partial<TPlan>,
): Promise<TPlan> => {
  const data = await Plan.findById(id).lean();
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  const result = await Plan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // Clear cache after update
  await clearPlanCache();

  return result!;
};

export const updatePlans = async (
  ids: string[],
  payload: Partial<Pick<TPlan, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const plans = await Plan.find({ _id: { $in: ids } }).lean();
  const foundIds = plans.map((plan) => plan._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await Plan.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  // Clear cache after update
  await clearPlanCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deletePlan = async (id: string): Promise<void> => {
  const plan = await Plan.findById(id);
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  await plan.softDelete();

  // Clear cache after deletion
  await clearPlanCache();
};

export const deletePlanPermanent = async (id: string): Promise<void> => {
  const plan = await Plan.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  await Plan.findByIdAndDelete(id).setOptions({ bypassDeleted: true });

  // Clear cache after deletion
  await clearPlanCache();
};

export const deletePlans = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const plans = await Plan.find({ _id: { $in: ids } }).lean();
  const foundIds = plans.map((plan) => plan._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Plan.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  // Clear cache after deletion
  await clearPlanCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePlansPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const plans = await Plan.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = plans.map((plan) => plan._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Plan.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  // Clear cache after deletion
  await clearPlanCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePlan = async (id: string): Promise<TPlan> => {
  const plan = await Plan.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found or not deleted');
  }

  // Clear cache after restoration
  await clearPlanCache();

  return plan;
};

export const restorePlans = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await Plan.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredPlans = await Plan.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredPlans.map((plan) => plan._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  // Clear cache after restoration
  await clearPlanCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
