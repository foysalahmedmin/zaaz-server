import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { TJwtPayload } from '../../types/jsonwebtoken.type';
import * as NotificationRecipientRepository from './notification-recipient.repository';
import { TNotificationRecipient } from './notification-recipient.type';

export const createNotificationRecipient = async (
  data: TNotificationRecipient,
): Promise<TNotificationRecipient> => {
  return await NotificationRecipientRepository.create(data);
};

export const getSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
): Promise<TNotificationRecipient> => {
  const result = await NotificationRecipientRepository.findOne({ _id: id, author: user._id });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found');
  }
  return result;
};

export const getNotificationRecipient = async (id: string): Promise<TNotificationRecipient> => {
  const result = await NotificationRecipientRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found');
  }
  return result;
};

export const getSelfNotificationRecipients = async (
  user: TJwtPayload,
  query: Record<string, unknown>,
): Promise<{ data: TNotificationRecipient[]; meta: { total: number; page: number; limit: number } }> => {
  return await NotificationRecipientRepository.findPaginated(
    query,
    { author: new mongoose.Types.ObjectId(user._id) },
    [{ key: 'unread', filter: { is_read: false } }],
  );
};

export const getNotificationRecipients = async (
  query: Record<string, unknown>,
): Promise<{ data: TNotificationRecipient[]; meta: { total: number; page: number; limit: number } }> => {
  return await NotificationRecipientRepository.findPaginated(query, {}, [
    { key: 'unread', filter: { is_read: false } },
  ]);
};

export const updateSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<TNotificationRecipient> => {
  const data = await NotificationRecipientRepository.findOne({ _id: id, author: user._id });
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found');
  }
  return (await NotificationRecipientRepository.findByIdAndUpdate(id, payload))!;
};

export const updateNotificationRecipient = async (
  id: string,
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<TNotificationRecipient> => {
  const data = await NotificationRecipientRepository.findById(id);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found');
  }
  return (await NotificationRecipientRepository.findByIdAndUpdate(id, payload))!;
};

export const readAllNotificationRecipients = async (
  user: TJwtPayload,
): Promise<{ count: number }> => {
  const result = await NotificationRecipientRepository.updateMany(
    { author: user._id },
    { is_read: true, read_at: new Date() },
  );
  return { count: result.modifiedCount };
};

export const updateSelfNotificationRecipients = async (
  user: TJwtPayload,
  ids: string[],
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const recipients = await NotificationRecipientRepository.findByAuthorAndIds(user._id, ids);
  const foundIds = recipients.map((r) => (r as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  const result = await NotificationRecipientRepository.updateMany(
    { _id: { $in: foundIds }, author: user._id },
    payload,
  );
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const updateNotificationRecipients = async (
  ids: string[],
  payload: Partial<Pick<TNotificationRecipient, 'is_read' | 'read_at'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const recipients = await NotificationRecipientRepository.findMany({ _id: { $in: ids } });
  const foundIds = recipients.map((r) => (r as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  const result = await NotificationRecipientRepository.updateMany(
    { _id: { $in: foundIds } },
    payload,
  );
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const deleteSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
): Promise<void> => {
  await NotificationRecipientRepository.softDeleteDoc({ _id: id, author: user._id });
};

export const deleteNotificationRecipient = async (id: string): Promise<void> => {
  const data = await NotificationRecipientRepository.findById(id);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found');
  }
  await NotificationRecipientRepository.softDeleteDoc({ _id: id });
};

export const deleteNotificationRecipientPermanent = async (id: string): Promise<void> => {
  const data = await NotificationRecipientRepository.findMany({ _id: id }, true);
  if (!data.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found');
  }
  await NotificationRecipientRepository.permanentDeleteById(id);
};

export const deleteSelfNotificationRecipients = async (
  user: TJwtPayload,
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const data = await NotificationRecipientRepository.findByAuthorAndIds(user._id, ids);
  const foundIds = data.map((d) => (d as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await NotificationRecipientRepository.updateMany(
    { _id: { $in: foundIds }, author: user._id },
    { is_deleted: true },
  );
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteAllSelfNotificationRecipients = async (
  user: TJwtPayload,
): Promise<{ count: number }> => {
  const result = await NotificationRecipientRepository.updateMany(
    { author: user._id, is_deleted: { $ne: true } },
    { is_deleted: true },
  );
  return { count: result.modifiedCount };
};

export const deleteNotificationRecipients = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const data = await NotificationRecipientRepository.findMany({ _id: { $in: ids } });
  const foundIds = data.map((d) => (d as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await NotificationRecipientRepository.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteNotificationRecipientsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const data = await NotificationRecipientRepository.findMany(
    { _id: { $in: ids }, is_deleted: true },
    true,
  );
  const foundIds = data.map((d) => (d as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await NotificationRecipientRepository.permanentDeleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const restoreSelfNotificationRecipient = async (
  user: TJwtPayload,
  id: string,
): Promise<TNotificationRecipient> => {
  const data = await NotificationRecipientRepository.findOneAndRestore({
    _id: id,
    is_deleted: true,
    author: user._id,
  });
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found or not deleted');
  }
  return data;
};

export const restoreNotificationRecipient = async (id: string): Promise<TNotificationRecipient> => {
  const data = await NotificationRecipientRepository.findOneAndRestore({
    _id: id,
    is_deleted: true,
  });
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found or not deleted');
  }
  return data;
};

export const restoreSelfNotificationRecipients = async (
  user: TJwtPayload,
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await NotificationRecipientRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
    author: user._id,
  });
  const restored = await NotificationRecipientRepository.findByAuthorAndIds(user._id, ids);
  const restoredIds = restored.map((r) => (r as any)._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};

export const restoreNotificationRecipients = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await NotificationRecipientRepository.restoreMany({
    _id: { $in: ids },
    is_deleted: true,
  });
  const restored = await NotificationRecipientRepository.findMany({ _id: { $in: ids } });
  const restoredIds = restored.map((r) => (r as any)._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));
  return { count: result.modifiedCount, not_found_ids: notFoundIds };
};
