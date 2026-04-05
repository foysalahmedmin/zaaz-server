/**
 * Package Repository
 *
 * Handles direct database interactions for the Package module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { Package } from './package.model';
import { TPackage } from './package.type';
import mongoose from 'mongoose';

export { Package };

/**
 * Find a package by ID.
 */
export const findById = async (id: string | mongoose.Types.ObjectId): Promise<TPackage | null> => {
  return await Package.findById(id).lean();
};

/**
 * Find all active packages.
 */
export const findActive = async (): Promise<TPackage[]> => {
  return await Package.find({ is_active: true, is_deleted: false }).sort({ order: 1 }).lean();
};

/**
 * Find paginated packages.
 */
export const findPaginated = async (
  query: Record<string, unknown>
): Promise<{
  data: TPackage[];
  meta: { total: number; page: number; limit: number };
}> => {
  const appQuery = new AppAggregationQuery<TPackage>(Package, query)
    .search(['name', 'description'])
    .filter()
    .sort(['order', 'created_at'] as any)
    .paginate()
    .fields();

  return await appQuery.execute();
};

/**
 * Create a new package.
 */
export const create = async (payload: Partial<TPackage>): Promise<TPackage> => {
  const result = await Package.create(payload);
  return result.toObject();
};

/**
 * Update a package by ID.
 */
export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TPackage>
): Promise<TPackage | null> => {
  return await Package.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
};

/**
 * Partial delete (soft delete).
 */
export const softDelete = async (id: string | mongoose.Types.ObjectId): Promise<TPackage | null> => {
  return await Package.findByIdAndUpdate(id, { is_deleted: true }, { new: true }).lean();
};
