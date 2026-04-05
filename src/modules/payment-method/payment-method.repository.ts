/**
 * PaymentMethod Repository
 *
 * Handles direct database interactions for the PaymentMethod module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { PaymentMethod } from './payment-method.model';
export { PaymentMethod }; // Export for AppAggregationQuery
import { TPaymentMethod } from './payment-method.type';

/**
 * Find a payment method by ID.
 */
export const findById = async (id: string): Promise<TPaymentMethod | null> => {
  return await PaymentMethod.findById(id).lean();
};

/**
 * Find a payment method by ID (with full document access).
 */
export const findByIdForUpdate = async (id: string) => {
  return await PaymentMethod.findById(id);
};

/**
 * Find a payment method by value and test status.
 */
export const findByValueAndTest = async (
  value: string,
  is_test: boolean
): Promise<TPaymentMethod | null> => {
  return await PaymentMethod.findOne({ value, is_test }).lean();
};

/**
 * Find all active payment methods.
 */
export const findActive = async (): Promise<TPaymentMethod[]> => {
  return await PaymentMethod.find({ is_active: true }).sort({ sequence: 1 }).lean();
};

export const findMany = async (ids: string[]): Promise<TPaymentMethod[]> => {
  return await PaymentMethod.find({ _id: { $in: ids } }).lean();
};

export const findManyWithDeleted = async (ids: string[] | any[]): Promise<TPaymentMethod[]> => {
  return await PaymentMethod.find({ _id: { $in: ids } }).setOptions({ bypassDeleted: true }).lean();
};

/**
 * Find paginated payment methods.
 */
export const findPaginated = async (
  query: Record<string, unknown>
): Promise<{
  data: TPaymentMethod[];
  meta: { total: number; page: number; limit: number };
}> => {
  const appQuery = new AppAggregationQuery<TPaymentMethod>(PaymentMethod, query)
    .search(['name', 'value', 'description'])
    .filter()
    .sort(['name', 'value', 'sequence', 'created_at', 'updated_at'] as any)
    .paginate()
    .fields();

  return await appQuery.execute();
};

/**
 * Create a new payment method.
 */
export const create = async (payload: Partial<TPaymentMethod>): Promise<TPaymentMethod> => {
  const result = await PaymentMethod.create(payload);
  return result.toObject();
};

/**
 * Update a payment method by ID.
 */
export const updateById = async (
  id: string,
  payload: Partial<TPaymentMethod>
): Promise<TPaymentMethod | null> => {
  return await PaymentMethod.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

/**
 * Soft delete a payment method by ID.
 */
export const softDeleteById = async (id: string): Promise<void> => {
  const paymentMethod = await PaymentMethod.findById(id);
  if (paymentMethod) {
    await paymentMethod.softDelete();
  }
};

/**
 * Hard delete a payment method by ID.
 */
export const hardDeleteById = async (id: string | any): Promise<void> => {
  await PaymentMethod.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const hardDeleteMany = async (ids: string[] | any[]): Promise<void> => {
  await PaymentMethod.deleteMany({ _id: { $in: ids } }).setOptions({ bypassDeleted: true });
};

export const restoreById = async (id: string): Promise<TPaymentMethod | null> => {
  return await PaymentMethod.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true }
  ).setOptions({ bypassDeleted: true });
};

export const restoreMany = async (ids: string[]): Promise<{ modifiedCount: number }> => {
  const result = await PaymentMethod.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false }
  ).setOptions({ bypassDeleted: true });
  return { modifiedCount: result.modifiedCount };
};

/**
 * Update multiple payment methods.
 */
export const updateMany = async (
  filter: Record<string, any>,
  payload: Record<string, any>
): Promise<{ modifiedCount: number }> => {
  const result = await PaymentMethod.updateMany(filter, payload);
  return { modifiedCount: result.modifiedCount };
};
