import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { AiModelHistory } from './ai-model-history.model';
import { TAiModelHistory } from './ai-model-history.type';

export { AiModelHistory };

export const findPaginated = async (
  aiModelId: string,
  query: Record<string, unknown> = {},
): Promise<any> => {
  const q = new AppAggregationQuery<TAiModelHistory>(AiModelHistory, query);
  q.pipeline([{ $match: { ai_model: new mongoose.Types.ObjectId(aiModelId) } }]);
  q.populate([{ path: 'ai_model', justOne: true }]).sort().paginate().fields();
  return await q.execute();
};

export const findById = async (id: string): Promise<TAiModelHistory | null> => {
  return await AiModelHistory.findById(id).populate([{ path: 'ai_model' }]);
};

export const findMany = async (
  filter: Record<string, unknown>,
  bypassDeleted = false,
): Promise<TAiModelHistory[]> => {
  const query = AiModelHistory.find(filter);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const softDeleteById = async (id: string): Promise<void> => {
  await AiModelHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await AiModelHistory.findByIdAndDelete(id);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await AiModelHistory.updateMany(filter, update);
};

export const permanentDeleteMany = async (filter: Record<string, unknown>): Promise<void> => {
  await AiModelHistory.deleteMany(filter).setOptions({ bypassDeleted: true });
};

export const findOneAndRestore = async (
  filter: Record<string, unknown>,
): Promise<TAiModelHistory | null> => {
  return await AiModelHistory.findOneAndUpdate(filter, { is_deleted: false }, { new: true }).lean();
};

export const restoreMany = async (
  filter: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await AiModelHistory.updateMany(filter, { is_deleted: false });
};
