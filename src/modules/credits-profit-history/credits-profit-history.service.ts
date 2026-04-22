import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as CreditsProfitHistoryRepository from './credits-profit-history.repository';
import { TCreditsProfitHistory } from './credits-profit-history.type';

export const getCreditsProfitHistories = async (
  creditsProfitId: string,
  query: Record<string, unknown> = {},
): Promise<{ data: TCreditsProfitHistory[]; meta: { total: number; page: number; limit: number } }> => {
  return await CreditsProfitHistoryRepository.findPaginated(creditsProfitId, query);
};

export const getCreditsProfitHistory = async (id: string): Promise<TCreditsProfitHistory> => {
  const result = await CreditsProfitHistoryRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit history not found');
  }
  return result;
};

export const deleteCreditsProfitHistory = async (id: string): Promise<void> => {
  const histories = await CreditsProfitHistoryRepository.findMany({ _id: id });
  if (!histories.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit history not found');
  }
  await CreditsProfitHistoryRepository.softDeleteById(id);
};

export const deleteCreditsProfitHistoryPermanent = async (id: string): Promise<void> => {
  const doc = await CreditsProfitHistoryRepository.CreditsProfitHistory.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit history not found');
  }
  await CreditsProfitHistoryRepository.permanentDeleteById(id);
};

export const deleteCreditsProfitHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await CreditsProfitHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await CreditsProfitHistoryRepository.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteCreditsProfitHistoriesPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await CreditsProfitHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await CreditsProfitHistoryRepository.permanentDeleteMany({ _id: { $in: foundIds } });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restoreCreditsProfitHistory = async (id: string): Promise<TCreditsProfitHistory> => {
  const history = await CreditsProfitHistoryRepository.findOneAndRestore({
    _id: id,
    is_deleted: true,
  });
  if (!history) {
    throw new AppError(httpStatus.NOT_FOUND, 'Credits profit history not found or not deleted');
  }
  return history;
};

export const restoreCreditsProfitHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await CreditsProfitHistoryRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
  });
  const restored = await CreditsProfitHistoryRepository.findMany({ _id: { $in: ids } });
  const restoredIds = restored.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
