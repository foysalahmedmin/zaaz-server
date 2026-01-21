import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { AiModelHistory } from './ai-model-history.model';
import { TAiModelHistory } from './ai-model-history.type';

export const getAiModelHistories = async (
  aiModelId: string,
  query: Record<string, unknown> = {},
): Promise<{
  data: TAiModelHistory[];
  meta: { total: number; page: number; limit: number };
}> => {
  const historyQuery = new AppAggregationQuery<TAiModelHistory>(
    AiModelHistory,
    query,
  );

  historyQuery.pipeline([
    { $match: { ai_model: new mongoose.Types.ObjectId(aiModelId) } },
  ]);

  historyQuery
    .populate([{ path: 'ai_model', justOne: true }])
    .sort()
    .paginate()
    .fields();

  const result = await historyQuery.execute();

  return result;
};

export const getAiModelHistory = async (
  id: string,
): Promise<TAiModelHistory> => {
  const result = await AiModelHistory.findById(id).populate([
    { path: 'ai_model' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model history not found');
  }
  return result;
};

export const deleteAiModelHistory = async (id: string): Promise<void> => {
  const history = await AiModelHistory.findById(id).lean();
  if (!history) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model history not found');
  }

  await AiModelHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteAiModelHistoryPermanent = async (
  id: string,
): Promise<void> => {
  const history = await AiModelHistory.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!history) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model history not found');
  }

  await AiModelHistory.findByIdAndDelete(id);
};

export const deleteAiModelHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const histories = await AiModelHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = histories.map((h) => h._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await AiModelHistory.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteAiModelHistoriesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const histories = await AiModelHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = histories.map((h) => h._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await AiModelHistory.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreAiModelHistory = async (
  id: string,
): Promise<TAiModelHistory> => {
  const history = await AiModelHistory.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!history) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'AI Model history not found or not deleted',
    );
  }

  return history;
};

export const restoreAiModelHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await AiModelHistory.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredHistories = await AiModelHistory.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredHistories.map((h) => h._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
