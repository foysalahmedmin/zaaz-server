import AppAggregationQuery from '../../builder/app-aggregation-query';
import { Notification } from './notification.model';
import { TNotification } from './notification.type';
import mongoose from 'mongoose';

export { Notification };

export const create = async (data: TNotification): Promise<TNotification> => {
  const result = await Notification.create(data);
  return result.toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TNotification | null> => {
  return await Notification.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TNotification | null> => {
  return await Notification.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
): Promise<any> => {
  return await new AppAggregationQuery<TNotification>(Notification, query)
    .search(['title', 'message', 'type', 'priority'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TNotification>,
): Promise<TNotification | null> => {
  return await Notification.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
};

export const updateMany = async (
  ids: string[],
  payload: Partial<TNotification>,
): Promise<{ modifiedCount: number }> => {
  return await Notification.updateMany({ _id: { $in: ids } }, payload);
};

export const findByIds = async (ids: string[]): Promise<TNotification[]> => {
  return await Notification.find({ _id: { $in: ids } }).lean();
};

export const findByIdsWithDeleted = async (
  ids: string[],
): Promise<TNotification[]> => {
  return await Notification.find({ _id: { $in: ids }, is_deleted: true })
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  const doc = await Notification.findById(id);
  if (doc) await doc.softDelete();
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await Notification.findByIdAndDelete(id);
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await Notification.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const permanentDeleteMany = async (ids: string[]): Promise<void> => {
  await Notification.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TNotification | null> => {
  return await Notification.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await Notification.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};
