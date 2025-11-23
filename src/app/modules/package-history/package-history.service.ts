import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { PackageHistory } from './package-history.model';
import { TPackageHistory } from './package-history.type';

export const getPackageHistories = async (
  packageId: string,
  query: Record<string, unknown> = {},
): Promise<{
  data: TPackageHistory[];
  meta: { total: number; page: number; limit: number };
}> => {
  const packageHistoryQuery = new AppQuery<TPackageHistory>(
    PackageHistory.find({ package: packageId }).populate([
      { path: 'package' },
      { path: 'features' },
    ]),
    query,
  )
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await packageHistoryQuery.execute();

  return result;
};

export const getPackageHistory = async (
  id: string,
): Promise<TPackageHistory> => {
  const result = await PackageHistory.findById(id).populate([
    { path: 'package' },
    { path: 'features' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package history not found');
  }
  return result;
};

export const deletePackageHistory = async (id: string): Promise<void> => {
  const packageHistory = await PackageHistory.findById(id).lean();
  if (!packageHistory) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package history not found');
  }

  await PackageHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const deletePackageHistoryPermanent = async (
  id: string,
): Promise<void> => {
  const packageHistory = await PackageHistory.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!packageHistory) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package history not found');
  }

  await PackageHistory.findByIdAndDelete(id);
};

export const deletePackageHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packageHistories = await PackageHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = packageHistories.map((packageHistory) =>
    packageHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PackageHistory.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePackageHistoriesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packageHistories = await PackageHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = packageHistories.map((packageHistory) =>
    packageHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PackageHistory.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePackageHistory = async (
  id: string,
): Promise<TPackageHistory> => {
  const packageHistory = await PackageHistory.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!packageHistory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package history not found or not deleted',
    );
  }

  return packageHistory;
};

export const restorePackageHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await PackageHistory.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredPackageHistories = await PackageHistory.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredPackageHistories.map((packageHistory) =>
    packageHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
