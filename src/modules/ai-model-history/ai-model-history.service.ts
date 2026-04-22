import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as AiModelHistoryRepository from './ai-model-history.repository';
import { TAiModelHistory } from './ai-model-history.type';

export const getAiModelHistories = async (
  aiModelId: string,
  query: Record<string, unknown> = {},
): Promise<{ data: TAiModelHistory[]; meta: { total: number; page: number; limit: number } }> => {
  return await AiModelHistoryRepository.findPaginated(aiModelId, query);
};

export const getAiModelHistory = async (id: string): Promise<TAiModelHistory> => {
  const result = await AiModelHistoryRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model history not found');
  }
  return result;
};

export const deleteAiModelHistory = async (id: string): Promise<void> => {
  const history = await AiModelHistoryRepository.findMany({ _id: id });
  if (!history.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model history not found');
  }
  await AiModelHistoryRepository.softDeleteById(id);
};

export const deleteAiModelHistoryPermanent = async (id: string): Promise<void> => {
  const history = await AiModelHistoryRepository.findMany({ _id: id }, true);
  if (!history.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model history not found');
  }
  await AiModelHistoryRepository.permanentDeleteById(id);
};

export const deleteAiModelHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await AiModelHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await AiModelHistoryRepository.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteAiModelHistoriesPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const histories = await AiModelHistoryRepository.findMany({ _id: { $in: ids } });
  const foundIds = histories.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await AiModelHistoryRepository.permanentDeleteMany({ _id: { $in: foundIds } });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restoreAiModelHistory = async (id: string): Promise<TAiModelHistory> => {
  const history = await AiModelHistoryRepository.findOneAndRestore({ _id: id, is_deleted: true });
  if (!history) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model history not found or not deleted');
  }
  return history;
};

export const restoreAiModelHistories = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await AiModelHistoryRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
  });
  const restored = await AiModelHistoryRepository.findMany({ _id: { $in: ids } });
  const restoredIds = restored.map((h) => (h as any)._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
