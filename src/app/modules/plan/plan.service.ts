import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import AppFindQuery from '../../builder/AppFindQuery';
import { Plan } from './plan.model';
import { TPlan } from './plan.type';

export const createPlan = async (data: TPlan): Promise<TPlan> => {
  const result = await Plan.create([data]);
  return result[0].toObject();
};

export const getPlan = async (id: string): Promise<TPlan> => {
  const result = await Plan.findById(id).lean();
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }
  return result;
};

export const getPlans = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPlan[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { ...rest } = query;

  const filter: Record<string, unknown> = {};

  const planQuery = new AppFindQuery<TPlan>(Plan.find(), { ...rest, ...filter })
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

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
};

export const deletePlanPermanent = async (id: string): Promise<void> => {
  const plan = await Plan.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  await Plan.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
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

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
