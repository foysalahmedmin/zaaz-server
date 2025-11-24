import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { Package } from '../package/package.model';
import { Plan } from '../plan/plan.model';
import { PackagePlan } from './package-plan.model';
import { TPackagePlan } from './package-plan.type';

export const createPackagePlan = async (
  data: TPackagePlan,
  session?: mongoose.ClientSession,
): Promise<TPackagePlan> => {
  // Validate plan exists and is active
  const plan = await Plan.findById(data.plan)
    .session(session || null)
    .lean();
  if (!plan || !plan.is_active) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Plan not found or is not active',
    );
  }

  // Validate package exists and is active
  const packageData = await Package.findById(data.package)
    .session(session || null)
    .lean();
  if (!packageData || !packageData.is_active) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Package not found or is not active',
    );
  }

  // Check if package-plan already exists
  const existing = await PackagePlan.findOne({
    package: data.package,
    plan: data.plan,
  })
    .session(session || null)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (existing) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Package-plan combination already exists',
    );
  }

  // If setting as initial, unset other initial plans for this package
  if (data.is_initial) {
    await PackagePlan.updateMany(
      { package: data.package, is_initial: true },
      { is_initial: false },
      { session },
    );
  }

  const result = await PackagePlan.create([data], { session });
  return result[0].toObject();
};

export const createPackagePlans = async (
  data: TPackagePlan[],
  session?: mongoose.ClientSession,
): Promise<TPackagePlan[]> => {
  // Ensure only one is_initial=true per package
  const packageId = data[0]?.package;
  if (packageId) {
    const initialPlans = data.filter((d) => d.is_initial === true);
    if (initialPlans.length > 1) {
      // Keep only the first initial plan, unset others
      let foundFirst = false;
      data.forEach((d) => {
        if (d.is_initial === true) {
          if (!foundFirst) {
            foundFirst = true;
          } else {
            d.is_initial = false;
          }
        }
      });
    }

    // Unset any existing initial plans for this package before creating new ones
    if (initialPlans.length > 0) {
      await PackagePlan.updateMany(
        { package: packageId, is_initial: true },
        { is_initial: false },
        { session },
      );
    }
  }

  const results = await PackagePlan.create(data, { session });
  return results.map((r) => r.toObject());
};

export const getPackagePlan = async (id: string): Promise<TPackagePlan> => {
  const result = await PackagePlan.findById(id)
    .populate('plan')
    .populate('package')
    .lean();
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-plan not found');
  }
  return result;
};

export const getPackagePlans = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPackagePlan[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { package: packageId, plan: planId, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (packageId) {
    filter.package = packageId;
  }

  if (planId) {
    filter.plan = planId;
  }

  const packagePlanQuery = new AppQuery<TPackagePlan>(
    PackagePlan.find().populate('plan').populate('package'),
    { ...rest, ...filter },
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await packagePlanQuery.execute([
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

export const getPackagePlansByPackage = async (
  packageId: string,
  activeOnly: boolean = false,
): Promise<TPackagePlan[]> => {
  const filter: any = {
    package: packageId,
    is_deleted: { $ne: true },
  };

  if (activeOnly) {
    filter.is_active = true;
  }

  const results = await PackagePlan.find(filter)
    .populate('plan')
    .sort({ is_initial: -1, created_at: 1 })
    .lean();

  return results;
};

export const getInitialPackagePlan = async (
  packageId: string,
): Promise<TPackagePlan | null> => {
  const result = await PackagePlan.findOne({
    package: packageId,
    is_initial: true,
    is_active: true,
    is_deleted: { $ne: true },
  })
    .populate('plan')
    .lean();

  return result;
};

export const updatePackagePlan = async (
  id: string,
  payload: Partial<TPackagePlan>,
  session?: mongoose.ClientSession,
): Promise<TPackagePlan> => {
  const data = await PackagePlan.findById(id)
    .session(session || null)
    .lean();
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-plan not found');
  }

  // If setting as initial, unset other initial plans for this package
  if (payload.is_initial === true) {
    await PackagePlan.updateMany(
      { package: data.package, is_initial: true, _id: { $ne: id } },
      { is_initial: false },
      { session },
    );
  }

  // Validate plan if being updated
  if (payload.plan) {
    const plan = await Plan.findById(payload.plan)
      .session(session || null)
      .lean();
    if (!plan || !plan.is_active) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Plan not found or is not active',
      );
    }
  }

  // Validate package if being updated
  if (payload.package) {
    const packageData = await Package.findById(payload.package)
      .session(session || null)
      .lean();
    if (!packageData || !packageData.is_active) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Package not found or is not active',
      );
    }
  }

  const result = await PackagePlan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).session(session || null);

  return result!;
};

export const deletePackagePlan = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const packagePlan = await PackagePlan.findById(id).session(session || null);
  if (!packagePlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-plan not found');
  }

  await packagePlan.softDelete();
};

export const deletePackagePlansByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePlan.updateMany(
    { package: packageId },
    { is_deleted: true },
    { session },
  );
};

export const restorePackagePlansByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePlan.updateMany(
    { package: packageId, is_deleted: true },
    { is_deleted: false },
    { session },
  );
};
