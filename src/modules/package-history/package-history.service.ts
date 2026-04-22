import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as PackageHistoryRepository from './package-history.repository';
import { TPackageHistory } from './package-history.type';

export const getPackageHistories = async (
  packageId: string,
  query: Record<string, unknown> = {},
): Promise<{ data: TPackageHistory[]; meta: { total: number; page: number; limit: number } }> => {
  return await PackageHistoryRepository.findPaginated(packageId, query);
};

export const getPackageHistory = async (id: string): Promise<TPackageHistory> => {
  const result = await PackageHistoryRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package history not found');
  }
  return result;
};

export const deletePackageHistory = async (id: string): Promise<void> => {
  const histories = await PackageHistoryRepository.findMany({ _id: id });
  if (!histories.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package history not found');
  }
  await PackageHistoryRepository.softDeleteById(id);
};

export const deletePackageHistoryPermanent = async (id: string): Promise<void> => {
  const doc = await PackageHistoryRepository.PackageHistory.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package history not found');
  }
  await PackageHistoryRepository.permanentDeleteById(id);
};

export const deletePackageHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await PackageHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await PackageHistoryRepository.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deletePackageHistoriesPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await PackageHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await PackageHistoryRepository.permanentDeleteMany({ _id: { $in: foundIds } });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restorePackageHistory = async (id: string): Promise<TPackageHistory> => {
  const history = await PackageHistoryRepository.findOneAndRestore({ _id: id, is_deleted: true });
  if (!history) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package history not found or not deleted');
  }
  return history;
};

export const restorePackageHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await PackageHistoryRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
  });
  const restored = await PackageHistoryRepository.findMany({ _id: { $in: ids } });
  const restoredIds = restored.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
