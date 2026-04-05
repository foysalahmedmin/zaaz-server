/**
 * PaymentTransaction Repository
 *
 * Handles direct database interactions for the PaymentTransaction module.
 */

import AppAggregationQuery from '../../builder/app-aggregation-query';
import { PaymentTransaction } from './payment-transaction.model';
import { PaymentAuditLog } from './payment-audit.model';
import { TPaymentTransaction } from './payment-transaction.type';
import mongoose from 'mongoose';

export { PaymentTransaction };

/**
 * Find a transaction by ID.
 */
export const findById = async (id: string | mongoose.Types.ObjectId): Promise<TPaymentTransaction | null> => {
  return await PaymentTransaction.findById(id).lean();
};

/**
 * Find a transaction by ID with session.
 */
export const findByIdWithSession = async (
  id: string | mongoose.Types.ObjectId,
  session: mongoose.ClientSession | null
): Promise<TPaymentTransaction | null> => {
  return await PaymentTransaction.findById(id).session(session).lean();
};

/**
 * Find a transaction by gateway session ID.
 */
export const findByGatewaySessionId = async (sessionId: string): Promise<TPaymentTransaction | null> => {
  return await PaymentTransaction.findOne({ gateway_session_id: sessionId }).lean();
};

/**
 * Find transactions by multiple IDs.
 */
export const findMany = async (ids: string[] | mongoose.Types.ObjectId[]): Promise<TPaymentTransaction[]> => {
  return await PaymentTransaction.find({ _id: { $in: ids } }).lean();
};

/**
 * Find paginated transactions.
 */
export const findPaginated = async (
  query: Record<string, unknown>
): Promise<{
  data: TPaymentTransaction[];
  meta: { total: number; page: number; limit: number };
}> => {
  const appQuery = new AppAggregationQuery<TPaymentTransaction>(PaymentTransaction, query)
    .search(['email', 'customer_email', 'gateway_transaction_id', 'gateway_session_id'])
    .filter()
    .sort(['created_at', 'updated_at', 'amount'] as any)
    .paginate()
    .fields();

  return await appQuery.execute();
};

/**
 * Create a new payment transaction.
 */
export const create = async (
  payload: Partial<TPaymentTransaction>[],
  options?: mongoose.SaveOptions
): Promise<TPaymentTransaction[]> => {
  return await PaymentTransaction.create(payload, options);
};

/**
 * Update a transaction by ID.
 */
export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TPaymentTransaction>,
  options = { new: true, runValidators: true }
): Promise<TPaymentTransaction | null> => {
  return await PaymentTransaction.findByIdAndUpdate(id, payload, options);
};

/**
 * Update a transaction by ID with session.
 */
export const updateByIdWithSession = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TPaymentTransaction>,
  session: mongoose.ClientSession | null
): Promise<TPaymentTransaction | null> => {
  return await PaymentTransaction.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    session,
  });
};

/**
 * Update a transaction by gateway session ID.
 */
export const updateByGatewaySessionId = async (
  sessionId: string,
  payload: Partial<TPaymentTransaction>
): Promise<TPaymentTransaction | null> => {
  return await PaymentTransaction.findOneAndUpdate(
    { gateway_session_id: sessionId },
    payload,
    { new: true, runValidators: true }
  );
};

/**
 * Create a payment audit log.
 */
export const createAuditLog = async (
  payload: any[],
  options?: mongoose.SaveOptions
): Promise<any> => {
  return await PaymentAuditLog.create(payload, options);
};

/**
 * Find transactions for a specific user.
 */
export const findByUserId = async (userId: string): Promise<TPaymentTransaction[]> => {
  return await PaymentTransaction.find({ user: userId }).sort({ created_at: -1 }).lean();
};
