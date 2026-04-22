import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { emitToUser } from '../../config/socket';
import { NotificationRecipient } from '../notification-recipient/notification-recipient.model';
import { TNotificationMetadata } from '../notification-recipient/notification-recipient.type';
import { User } from '../user/user.model';
import * as NotificationRepository from './notification.repository';
import { TNotification } from './notification.type';

export const createNotification = async (
  data: TNotification,
): Promise<TNotification> => {
  return await NotificationRepository.create(data);
};

export const getNotification = async (id: string): Promise<TNotification> => {
  const result = await NotificationRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  return result;
};

export const getNotifications = async (
  query: Record<string, unknown>,
): Promise<{ data: TNotification[]; meta: any }> => {
  return await NotificationRepository.findPaginated(query);
};

export const updateNotification = async (
  id: string,
  payload: Partial<Pick<TNotification, 'title' | 'message' | 'type' | 'priority'>>,
): Promise<TNotification> => {
  const existing = await NotificationRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  const result = await NotificationRepository.updateById(id, payload);
  return result!;
};

export const updateNotifications = async (
  ids: string[],
  payload: Partial<Pick<TNotification, 'status'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await NotificationRepository.findByIds(ids);
  const foundIds = existing.map((n) => (n as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  const result = await NotificationRepository.updateMany(foundIds, payload);
  return { count: result.modifiedCount, not_found_ids };
};

export const deleteNotification = async (id: string): Promise<void> => {
  const existing = await NotificationRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  await NotificationRepository.softDeleteById(id);
};

export const deleteNotificationPermanent = async (id: string): Promise<void> => {
  const existing = await NotificationRepository.findByIdWithDeleted(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  await NotificationRepository.permanentDeleteById(id);
};

export const deleteNotifications = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await NotificationRepository.findByIds(ids);
  const foundIds = existing.map((n) => (n as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await NotificationRepository.softDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const deleteNotificationsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await NotificationRepository.findByIdsWithDeleted(ids);
  const foundIds = existing.map((n) => (n as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await NotificationRepository.permanentDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const restoreNotification = async (id: string): Promise<TNotification> => {
  const result = await NotificationRepository.restore(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification not found or not deleted',
    );
  }
  return result;
};

export const restoreNotifications = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await NotificationRepository.restoreMany(ids);

  const restored = await NotificationRepository.findByIds(ids);
  const restoredIds = restored.map((n) => (n as any)._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  return { count: result.modifiedCount, not_found_ids };
};

export const notifyAdmins = async (
  payload: Pick<TNotification, 'title' | 'message' | 'url' | 'metadata'>,
  metadata: TNotificationMetadata = {},
): Promise<void> => {
  const systemUser = await User.findOne({ role: 'super-admin' }).lean();
  if (!systemUser) return;

  const notification = await NotificationRepository.create({
    ...payload,
    type: 'request',
    channels: ['web'],
    sender: systemUser._id,
  } as TNotification);

  const admins = await User.find({
    role: { $in: ['admin', 'super-admin'] },
  }).lean();

  const recipientPromises = admins.map(async (admin) => {
    const recipient = await NotificationRecipient.create({
      notification: (notification as any)._id,
      recipient: admin._id,
      metadata,
      is_read: false,
    });

    const populatedRecipient = await NotificationRecipient.findById(recipient._id)
      .populate('notification')
      .lean();

    emitToUser(
      admin._id.toString(),
      'notification-recipient-created',
      populatedRecipient,
    );
  });

  await Promise.all(recipientPromises);
};

export const notifyUser = async (
  userId: string,
  payload: Pick<TNotification, 'title' | 'message' | 'url' | 'metadata'>,
  metadata: TNotificationMetadata = {},
): Promise<void> => {
  const systemUser = await User.findOne({ role: 'super-admin' }).lean();
  if (!systemUser) return;

  const notification = await NotificationRepository.create({
    ...payload,
    type: 'request',
    channels: ['web'],
    sender: systemUser._id,
  } as TNotification);

  const recipient = await NotificationRecipient.create({
    notification: (notification as any)._id,
    recipient: userId,
    metadata,
    is_read: false,
  });

  const populatedRecipient = await NotificationRecipient.findById(recipient._id)
    .populate('notification')
    .lean();

  emitToUser(userId, 'notification-recipient-created', populatedRecipient);
};
