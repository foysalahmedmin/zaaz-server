/**
 * Plan Repository
 *
 * Handles direct database interactions for the Plan module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { Plan } from './plan.model';
import { TPlan } from './plan.type';
import mongoose from 'mongoose';

export { Plan };

/**
 * Find a plan by ID.
 */
export const findById = async (id: string | mongoose.Types.ObjectId): Promise<TPlan | null> => {
  return await Plan.findById(id).lean();
};

/**
 * Find all active plans.
 */
export const findActive = async (): Promise<TPlan[]> => {
  return await Plan.find({ is_active: true, is_deleted: false }).sort({ order: 1 }).lean();
};

/**
 * Find paginated plans.
 */
export const findPaginated = async (
  query: Record<string, unknown>
): Promise<{
  data: TPlan[];
  meta: { total: number; page: number; limit: number };
}> => {
  const appQuery = new AppAggregationQuery<TPlan>(Plan, query)
    .search(['name', 'description'])
    .filter()
    .sort(['order', 'created_at'] as any)
    .paginate()
    .fields();

  return await appQuery.execute();
};

/**
 * Create a new plan.
 */
export const create = async (payload: Partial<TPlan>): Promise<TPlan> => {
  const result = await Plan.create(payload);
  return result.toObject();
};

/**
 * Update a plan by ID.
 */
export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TPlan>
): Promise<TPlan | null> => {
  return await Plan.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
};

/**
 * Partial delete (soft delete).
 */
export const softDelete = async (id: string | mongoose.Types.ObjectId): Promise<TPlan | null> => {
  return await Plan.findByIdAndUpdate(id, { is_deleted: true }, { new: true }).lean();
};
