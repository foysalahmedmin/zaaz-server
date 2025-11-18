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

