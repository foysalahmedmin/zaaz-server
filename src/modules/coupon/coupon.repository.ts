/**
 * Coupon Repository
 *
 * Handles direct database interactions for the Coupon module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { Coupon } from './coupon.model';
import { TCoupon } from './coupon.type';
import mongoose from 'mongoose';

export { Coupon };

/**
 * Find a coupon by ID.
 */
export const findById = async (id: string | mongoose.Types.ObjectId): Promise<TCoupon | null> => {
  return await Coupon.findById(id).lean();
};

/**
 * Find paginated coupons.
 */
export const findPaginated = async (
  query: Record<string, unknown>,
  customFilters: any[]
): Promise<any> => {
  const couponQuery = new AppAggregationQuery<TCoupon>(Coupon, query)
    .search(['code'])
    .filter()
    .sort()
    .paginate()
    .fields();

  return await couponQuery.execute(customFilters);
};

/**
 * Get total usage count of all coupons.
 */
export const getTotalUsage = async (): Promise<number> => {
  const result = await Coupon.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$usage_count' } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Create a new coupon.
 */
export const create = async (payload: Partial<TCoupon>): Promise<TCoupon> => {
  const result = await Coupon.create(payload);
  return result.toObject();
};

/**
 * Update a coupon by ID.
 */
export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TCoupon>
): Promise<TCoupon | null> => {
  return await Coupon.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
};

/**
 * Partial delete (soft delete).
 */
export const softDelete = async (id: string | mongoose.Types.ObjectId): Promise<TCoupon | null> => {
  return await Coupon.findByIdAndUpdate(id, { is_deleted: true }, { new: true }).lean();
};

/**
 * Soft delete by code.
 */
export const softDeleteByCode = async (code: string, options: Record<string, any> = {}): Promise<TCoupon | null> => {
  return await Coupon.findOneAndUpdate({ code }, { is_deleted: true }, { new: true, ...options }).setOptions(options).lean();
};

/**
 * Update coupon by code.
 */
export const updateByCode = async (
  code: string,
  payload: Partial<TCoupon>,
  options: Record<string, any> = {}
): Promise<TCoupon | null> => {
  return await Coupon.findOneAndUpdate({ code }, payload, {
    new: true,
    runValidators: true,
    ...options,
  }).setOptions(options).lean();
};

/**
 * Find coupon by code.
 */
export const findByCode = async (code: string, options: Record<string, any> = {}): Promise<TCoupon | null> => {
  return await Coupon.findOne({ code }).setOptions(options).lean();
};

/**
 * Find active coupon by code.
 */
export const findActiveByCode = async (code: string): Promise<TCoupon | null> => {
  return await Coupon.findOne({ code, is_active: true, is_deleted: { $ne: true } }).lean();
};

/**
 * Check if coupon exists.
 */
export const isCouponExist = async (id: string) => {
  // @ts-ignore
  return await Coupon.isCouponExist(id);
};
