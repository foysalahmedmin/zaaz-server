import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { Package } from '../package/package.model';
import { clearPackageCache } from '../package/package.service';
import { Plan } from '../plan/plan.model';
import * as PackagePlanRepository from './package-plan.repository';
import { TPackagePlan } from './package-plan.type';

export const createPackagePlan = async (
  data: TPackagePlan,
  session?: mongoose.ClientSession,
): Promise<TPackagePlan> => {
  const plan = await Plan.findById(data.plan).session(session || null).lean();
  if (!plan || !plan.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Plan not found or is not active');
  }

  const packageData = await Package.findById(data.package).session(session || null).lean();
  if (!packageData || !packageData.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Package not found or is not active');
  }

  const existing = await PackagePlanRepository.findOne(
    { package: data.package, plan: data.plan },
    session,
    true,
  );
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Package-plan combination already exists');
  }

  if (data.is_initial) {
    await PackagePlanRepository.updateMany(
      { package: data.package, is_initial: true },
      { is_initial: false },
      session,
    );
  }

  const result = await PackagePlanRepository.create(data, session);
  await clearPackageCache();
  return result;
};

export const createPackagePlans = async (
  data: TPackagePlan[],
  session?: mongoose.ClientSession,
): Promise<TPackagePlan[]> => {
  const packageId = data[0]?.package;
  if (packageId) {
    const initialPlans = data.filter((d) => d.is_initial === true);
    if (initialPlans.length > 1) {
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

    if (initialPlans.length > 0) {
      await PackagePlanRepository.updateMany(
        { package: packageId, is_initial: true },
        { is_initial: false },
        session,
      );
    }
  }

  const results = await PackagePlanRepository.createMany(data, session);
  await clearPackageCache();
  return results;
};

export const getPackagePlan = async (id: string): Promise<TPackagePlan> => {
  const result = await PackagePlanRepository.PackagePlan.findById(id)
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
): Promise<{ data: TPackagePlan[]; meta: { total: number; page: number; limit: number } }> => {
  const { package: packageId, plan: planId, ...rest } = query;
  const filter: Record<string, unknown> = {};
  if (packageId) filter.package = new mongoose.Types.ObjectId(packageId as string);
  if (planId) filter.plan = new mongoose.Types.ObjectId(planId as string);

  return await PackagePlanRepository.findPaginated(rest, filter, [
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ]);
};

export const getPackagePlansByPackage = async (
  packageId: string,
  activeOnly = false,
): Promise<TPackagePlan[]> => {
  return await PackagePlanRepository.findByPackage(packageId, activeOnly);
};

export const getInitialPackagePlan = async (
  packageId: string,
): Promise<TPackagePlan | null> => {
  return await PackagePlanRepository.findOne({
    package: packageId,
    is_initial: true,
    is_active: true,
    is_deleted: { $ne: true },
  });
};

export const updatePackagePlan = async (
  id: string,
  payload: Partial<TPackagePlan>,
  session?: mongoose.ClientSession,
): Promise<TPackagePlan> => {
  const data = await PackagePlanRepository.findById(id, session);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-plan not found');
  }

  if (payload.is_initial === true) {
    await PackagePlanRepository.updateMany(
      { package: data.package, is_initial: true, _id: { $ne: id } },
      { is_initial: false },
      session,
    );
  }

  if (payload.plan) {
    const plan = await Plan.findById(payload.plan).session(session || null).lean();
    if (!plan || !plan.is_active) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Plan not found or is not active');
    }
  }

  if (payload.package) {
    const packageData = await Package.findById(payload.package).session(session || null).lean();
    if (!packageData || !packageData.is_active) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Package not found or is not active');
    }
  }

  const result = await PackagePlanRepository.updateById(id, payload, session);
  await clearPackageCache();
  return result!;
};

export const deletePackagePlan = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const packagePlan = await PackagePlanRepository.findById(id, session);
  if (!packagePlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-plan not found');
  }
  await PackagePlanRepository.softDeleteById(id, session);
  await clearPackageCache();
};

export const deletePackagePlansByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePlanRepository.softDeleteByPackage(packageId, session);
  await clearPackageCache();
};

export const restorePackagePlansByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePlanRepository.restoreByPackage(packageId, session);
  await clearPackageCache();
};
