import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { NotificationRecipient } from './notification-recipient.model';
import { TNotificationRecipient } from './notification-recipient.type';

export { NotificationRecipient };

export const create = async (data: TNotificationRecipient): Promise<TNotificationRecipient> => {
  const result = await NotificationRecipient.create(data);
  return result.toObject();
};

export const findOne = async (
  filter: Record<string, unknown>,
): Promise<TNotificationRecipient | null> => {
  return await NotificationRecipient.findOne(filter).lean();
};

export const findById = async (id: string): Promise<TNotificationRecipient | null> => {
  return await NotificationRecipient.findById(id).lean();
};

export const findMany = async (
  filter: Record<string, unknown>,
  bypassDeleted = false,
): Promise<TNotificationRecipient[]> => {
  const query = NotificationRecipient.find(filter);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  matchFilter: Record<string, unknown> = {},
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const q = new AppAggregationQuery<TNotificationRecipient>(NotificationRecipient, query);
  if (Object.keys(matchFilter).length > 0) {
    q.pipeline([{ $match: matchFilter }]);
  }
  q.populate([
    { path: 'recipient', select: '_id name email image', justOne: true },
    { path: 'notification', select: '_id title type sender', justOne: true },
  ])
    .filter()
    .sort()
    .paginate()
    .fields();
  return await q.execute(groups);
};

export const findByIdAndUpdate = async (
  id: string,
  payload: Record<string, unknown>,
): Promise<TNotificationRecipient | null> => {
  return await NotificationRecipient.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await NotificationRecipient.updateMany(filter, update);
};

export const softDeleteDoc = async (
  filter: Record<string, unknown>,
): Promise<void> => {
  const doc = await NotificationRecipient.findOne(filter);
  if (doc) await doc.softDelete();
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await NotificationRecipient.findByIdAndDelete(id);
};

export const permanentDeleteMany = async (filter: Record<string, unknown>): Promise<void> => {
  await NotificationRecipient.deleteMany(filter).setOptions({ bypassDeleted: true });
};

export const findOneAndRestore = async (
  filter: Record<string, unknown>,
): Promise<TNotificationRecipient | null> => {
  return await NotificationRecipient.findOneAndUpdate(
    filter,
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  filter: Record<string, unknown>,
): Promise<{ modifiedCount: number }> => {
  return await NotificationRecipient.updateMany(filter, { is_deleted: false });
};

export const findByAuthorAndIds = async (
  authorId: string,
  ids: string[],
): Promise<TNotificationRecipient[]> => {
  return await NotificationRecipient.find({
    _id: { $in: ids },
    author: new mongoose.Types.ObjectId(authorId),
  }).lean();
};
