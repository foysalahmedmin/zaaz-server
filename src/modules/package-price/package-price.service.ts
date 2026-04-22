import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { Package } from '../package/package.model';
import { clearPackageCache } from '../package/package.service';
import { Interval } from '../interval/interval.model';
import * as PackagePriceRepository from './package-price.repository';
import { TPackagePrice } from './package-price.type';

export const createPackagePrice = async (
  data: TPackagePrice,
  session?: mongoose.ClientSession,
): Promise<TPackagePrice> => {
  const interval = await Interval.findById(data.interval).session(session || null).lean();
  if (!interval || !interval.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Interval not found or is not active');
  }

  const packageData = await Package.findById(data.package).session(session || null).lean();
  if (!packageData || !packageData.is_active) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Package not found or is not active');
  }

  const existing = await PackagePriceRepository.findOne(
    { package: data.package, interval: data.interval },
    session,
    true,
  );
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Package-price combination already exists');
  }

  if (data.is_initial) {
    await PackagePriceRepository.updateMany(
      { package: data.package, is_initial: true },
      { is_initial: false },
      session,
    );
  }

  const result = await PackagePriceRepository.create(data, session);
  await clearPackageCache();
  return result;
};

export const createPackagePrices = async (
  data: TPackagePrice[],
  session?: mongoose.ClientSession,
): Promise<TPackagePrice[]> => {
  const packageId = data[0]?.package;
  if (packageId) {
    const initialPrices = data.filter((d) => d.is_initial === true);
    if (initialPrices.length > 1) {
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

    if (initialPrices.length > 0) {
      await PackagePriceRepository.updateMany(
        { package: packageId, is_initial: true },
        { is_initial: false },
        session,
      );
    }
  }

  const results = await PackagePriceRepository.createMany(data, session);
  await clearPackageCache();
  return results;
};

export const getPackagePrice = async (id: string): Promise<TPackagePrice> => {
  const result = await PackagePriceRepository.PackagePrice.findById(id)
    .populate('interval')
    .populate('package')
    .lean();
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-price not found');
  }
  return result;
};

export const getPackagePrices = async (
  query: Record<string, unknown>,
): Promise<{ data: TPackagePrice[]; meta: { total: number; page: number; limit: number } }> => {
  const { package: packageId, interval: intervalId, ...rest } = query;
  const filter: Record<string, unknown> = {};
  if (packageId) filter.package = new mongoose.Types.ObjectId(packageId as string);
  if (intervalId) filter.interval = new mongoose.Types.ObjectId(intervalId as string);

  return await PackagePriceRepository.findPaginated(rest, filter, [
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ]);
};

export const getPackagePricesByPackage = async (
  packageId: string,
  activeOnly = false,
): Promise<TPackagePrice[]> => {
  return await PackagePriceRepository.findByPackage(packageId, activeOnly);
};

export const getInitialPackagePrice = async (
  packageId: string,
): Promise<TPackagePrice | null> => {
  return await PackagePriceRepository.findOne({
    package: packageId,
    is_initial: true,
    is_active: true,
    is_deleted: { $ne: true },
  });
};

export const updatePackagePrice = async (
  id: string,
  payload: Partial<TPackagePrice>,
  session?: mongoose.ClientSession,
): Promise<TPackagePrice> => {
  const data = await PackagePriceRepository.findById(id, session);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-price not found');
  }

  if (payload.is_initial === true) {
    await PackagePriceRepository.updateMany(
      { package: data.package, is_initial: true, _id: { $ne: id } },
      { is_initial: false },
      session,
    );
  }

  if (payload.interval) {
    const interval = await Interval.findById(payload.interval).session(session || null).lean();
    if (!interval || !interval.is_active) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Interval not found or is not active');
    }
  }

  if (payload.package) {
    const packageData = await Package.findById(payload.package).session(session || null).lean();
    if (!packageData || !packageData.is_active) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Package not found or is not active');
    }
  }

  const result = await PackagePriceRepository.updateById(id, payload, session);
  await clearPackageCache();
  return result!;
};

export const deletePackagePrice = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const packagePrice = await PackagePriceRepository.findById(id, session);
  if (!packagePrice) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package-price not found');
  }
  await PackagePriceRepository.softDeleteById(id, session);
  await clearPackageCache();
};

export const deletePackagePricesByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePriceRepository.softDeleteByPackage(packageId, session);
  await clearPackageCache();
};

export const restorePackagePricesByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePriceRepository.restoreByPackage(packageId, session);
  await clearPackageCache();
};
