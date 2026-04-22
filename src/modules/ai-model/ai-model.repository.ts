/**
 * AI Model Repository
 *
 * Handles direct database interactions for the AI Model module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { AiModel } from './ai-model.model';
import { TAiModel } from './ai-model.type';
import mongoose from 'mongoose';

export { AiModel };

/**
 * Check if AI Model exists by value.
 */
export const isExistByValue = async (value: string): Promise<boolean> => {
  // @ts-ignore - The model has a static method isAiModelExistByValue
  return await AiModel.isAiModelExistByValue(value);
};

/**
 * Update many AI Models.
 */
export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
  session?: mongoose.ClientSession,
): Promise<any> => {
  return await AiModel.updateMany(filter, update, { session });
};

/**
 * Count active documents.
 */
export const countActive = async (session?: mongoose.ClientSession): Promise<number> => {
  return await AiModel.countDocuments({ is_deleted: { $ne: true } }).session(session || null);
};

/**
 * Create a new AI Model.
 */
export const create = async (payload: Partial<TAiModel>, session?: mongoose.ClientSession): Promise<TAiModel[]> => {
  return await AiModel.create([payload], { session });
};

/**
 * Find paginated AI Models.
 */
export const findPaginated = async (query: Record<string, unknown>): Promise<any> => {
  const aiModelQuery = new AppAggregationQuery(AiModel, query)
    .search(['name', 'value', 'provider'])
    .filter()
    .sort()
    .paginate()
    .fields();

  return await aiModelQuery.execute();
};

/**
 * Find by ID.
 */
export const findById = async (id: string | mongoose.Types.ObjectId): Promise<TAiModel | null> => {
  return await AiModel.findById(id).lean();
};

/**
 * Find one.
 */
export const findOne = async (filter: Record<string, unknown>): Promise<TAiModel | null> => {
  return await AiModel.findOne(filter).lean();
};

/**
 * Find active models by specific values.
 */
export const findActiveByValues = async (values: string[]): Promise<TAiModel[]> => {
  return await AiModel.find({
    value: { $in: values },
    is_active: true,
    is_deleted: { $ne: true },
  }).lean();
};

/**
 * Find initial active model.
 */
export const findInitialActive = async (): Promise<TAiModel | null> => {
  return await AiModel.findOne({
    is_initial: true,
    is_active: true,
    is_deleted: { $ne: true },
  }).lean();
};

/**
 * Update by ID.
 */
export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TAiModel>,
  session?: mongoose.ClientSession
): Promise<TAiModel | null> => {
  return await AiModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    session: session || null,
  }).lean();
};

/**
 * Soft delete by ID.
 */
export const softDelete = async (id: string | mongoose.Types.ObjectId): Promise<TAiModel | null> => {
  return await AiModel.findByIdAndUpdate(id, { is_deleted: true }, { new: true }).lean();
};

/**
 * Permanent Delete by ID.
 */
export const permanentDelete = async (id: string | mongoose.Types.ObjectId): Promise<TAiModel | null> => {
  return await AiModel.findByIdAndDelete(id).setOptions({ bypassDeleted: true }).lean();
};

/**
 * Find by IDs (bypassing deleted filter optionally).
 */
export const findByIds = async (
  ids: string[] | mongoose.Types.ObjectId[],
  filter: Record<string, unknown> = {},
  bypassDeleted = false
): Promise<TAiModel[]> => {
  const query = AiModel.find({ _id: { $in: ids }, ...filter });
  if (bypassDeleted) {
    query.setOptions({ bypassDeleted: true });
  }
  return await query.lean();
};

/**
 * Delete many by IDs.
 */
export const deleteMany = async (ids: string[], bypassDeleted = false): Promise<any> => {
  const query = AiModel.deleteMany({ _id: { $in: ids }, is_deleted: true });
  if (bypassDeleted) {
    query.setOptions({ bypassDeleted: true });
  }
  return await query;
};

/**
 * Restore AI Model by ID.
 */
export const restore = async (id: string | mongoose.Types.ObjectId): Promise<TAiModel | null> => {
  return await AiModel.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true }
  ).lean();
};
