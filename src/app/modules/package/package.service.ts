import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { PackageHistory } from '../package-history/package-history.model';
import { Package } from './package.model';
import { TPackage } from './package.type';

export const createPackage = async (
  data: TPackage,
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  const result = await Package.create([data], { session });
  return result[0].toObject();
};

export const getPublicPackage = async (id: string): Promise<TPackage> => {
  const result = await Package.findOne({
    _id: id,
    is_active: true,
  }).populate('features');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }
  return result;
};

export const getPackage = async (id: string): Promise<TPackage> => {
  const result = await Package.findById(id).populate('features');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }
  return result;
};

export const getPublicPackages = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPackage[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { currency, ...rest } = query;

  const filter: Record<string, unknown> = {
    is_active: true,
  };

  if (currency) {
    filter.currency = currency;
  }

  const packageQuery = new AppQuery<TPackage>(
    Package.find().populate([{ path: 'features' }]),
    { ...rest, ...filter },
  )
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await packageQuery.execute();

  return result;
};

export const getPackages = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPackage[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { currency, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (currency) {
    filter.currency = currency;
  }

  const packageQuery = new AppQuery<TPackage>(
    Package.find().populate([{ path: 'features' }]),
    { ...rest, ...filter },
  )
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await packageQuery.execute([
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

export const updatePackage = async (
  id: string,
  payload: Partial<TPackage>,
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  const packageData = await Package.findById(id).lean();
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // Create history before update
  await PackageHistory.create(
    [
      {
        package: id,
        name: packageData.name,
        description: packageData.description,
        content: packageData.content,
        token: packageData.token,
        features: packageData.features,
        duration: packageData.duration,
        price: packageData.price,
        previous_price: packageData.price_previous,
        is_active: packageData.is_active,
        is_deleted: packageData.is_deleted,
      },
    ],
    { session },
  );

  const result = await Package.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  ).session(session || null);

  return result!;
};

export const updatePackages = async (
  ids: string[],
  payload: Partial<Pick<TPackage, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packages = await Package.find({ _id: { $in: ids } }).lean();
  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await Package.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deletePackage = async (id: string): Promise<void> => {
  const packageData = await Package.findById(id);
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await packageData.softDelete();
};

export const deletePackagePermanent = async (id: string): Promise<void> => {
  const packageData = await Package.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await Package.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const deletePackages = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packages = await Package.find({ _id: { $in: ids } }).lean();
  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Package.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePackagesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packages = await Package.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Package.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePackage = async (id: string): Promise<TPackage> => {
  const packageData = await Package.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!packageData) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package not found or not deleted',
    );
  }

  return packageData;
};

export const restorePackages = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await Package.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredPackages = await Package.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredPackages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

