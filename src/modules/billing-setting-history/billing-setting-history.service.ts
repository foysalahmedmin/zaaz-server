import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as BillingSettingHistoryRepository from './billing-setting-history.repository';
import { TBillingSettingHistory } from './billing-setting-history.type';

export const getBillingSettingHistories = async (
  billingSettingId: string,
  query: Record<string, unknown> = {},
): Promise<{ data: TBillingSettingHistory[]; meta: { total: number; page: number; limit: number } }> => {
  return await BillingSettingHistoryRepository.findPaginated(billingSettingId, query);
};

export const getBillingSettingHistory = async (id: string): Promise<TBillingSettingHistory> => {
  const result = await BillingSettingHistoryRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting history not found');
  }
  return result;
};

export const deleteBillingSettingHistory = async (id: string): Promise<void> => {
  const histories = await BillingSettingHistoryRepository.findMany({ _id: id });
  if (!histories.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting history not found');
  }
  await BillingSettingHistoryRepository.softDeleteById(id);
};

export const deleteBillingSettingHistoryPermanent = async (id: string): Promise<void> => {
  const doc = await BillingSettingHistoryRepository.BillingSettingHistory.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!doc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting history not found');
  }
  await BillingSettingHistoryRepository.permanentDeleteById(id);
};

export const deleteBillingSettingHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await BillingSettingHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await BillingSettingHistoryRepository.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteBillingSettingHistoriesPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await BillingSettingHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await BillingSettingHistoryRepository.permanentDeleteMany({ _id: { $in: foundIds } });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restoreBillingSettingHistory = async (id: string): Promise<TBillingSettingHistory> => {
  const history = await BillingSettingHistoryRepository.findOneAndRestore({
    _id: id,
    is_deleted: true,
  });
  if (!history) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting history not found or not deleted');
  }
  return history;
};

export const restoreBillingSettingHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await BillingSettingHistoryRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
  });
  const restored = await BillingSettingHistoryRepository.findMany({ _id: { $in: ids } });
  const restoredIds = restored.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
