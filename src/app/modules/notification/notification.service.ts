import httpStatus from 'http-status';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { emitToUser } from '../../socket';
import { NotificationRecipient } from '../notification-recipient/notification-recipient.model';
import { TNotificationMetadata } from '../notification-recipient/notification-recipient.type';
import { User } from '../user/user.model';
import { Notification } from './notification.model';
import { TNotification } from './notification.type';

export const createNotification = async (
  data: TNotification,
): Promise<TNotification> => {
  const result = await Notification.create(data);
  return result.toObject();
};

export const getNotification = async (id: string): Promise<TNotification> => {
  const result = await Notification.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  return result;
};

export const getNotifications = async (
  query: Record<string, unknown>,
): Promise<{
  data: TNotification[];
  meta: { total: number; page: number; limit: number };
}> => {
  const notificationQuery = new AppAggregationQuery<TNotification>(
    Notification,
    query,
  )
    .search(['title', 'message', 'type', 'priority'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await notificationQuery.execute();

  return result;
};

export const updateNotification = async (
  id: string,
  payload: Partial<
    Pick<TNotification, 'title' | 'message' | 'type' | 'priority'>
  >,
): Promise<TNotification> => {
  const data = await Notification.findById(id).lean();
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  const result = await Notification.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result!;
};

export const updateNotifications = async (
  ids: string[],
  payload: Partial<Pick<TNotification, 'status'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const notifications = await Notification.find({ _id: { $in: ids } }).lean();
  const foundIds = notifications.map((notification) =>
    notification._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await Notification.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteNotification = async (id: string): Promise<void> => {
  const notification = await Notification.findById(id);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  await notification.softDelete();
};

export const deleteNotificationPermanent = async (
  id: string,
): Promise<void> => {
  const notification = await Notification.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  await Notification.findByIdAndDelete(id);
};

export const deleteNotifications = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const notifications = await Notification.find({ _id: { $in: ids } }).lean();
  const foundIds = notifications.map((notification) =>
    notification._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Notification.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteNotificationsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const notifications = await Notification.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();
  const foundIds = notifications.map((notification) =>
    notification._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Notification.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreNotification = async (
  id: string,
): Promise<TNotification> => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!notification) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Notification not found or not deleted',
    );
  }

  return notification;
};

export const restoreNotifications = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await Notification.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredNotifications = await Notification.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredNotifications.map((notification) =>
    notification._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

/**
 * Unified helper to send notifications to all admins (admin & super-admin)
 * Both persists in DB and emits via Socket.io
 */
export const notifyAdmins = async (
  payload: Pick<TNotification, 'title' | 'message' | 'url' | 'metadata'>,
  metadata: TNotificationMetadata = {},
): Promise<void> => {
  // 1. Find a sender (usually a system user or the first super-admin)
  const systemUser = await User.findOne({ role: 'super-admin' }).lean();
  if (!systemUser) return;

  // 2. Create the notification base
  const notification = await Notification.create({
    ...payload,
    type: 'request', // Default type for system alerts
    channels: ['web'],
    sender: systemUser._id,
  });

  // 3. Find all admin users
  const admins = await User.find({
    role: { $in: ['admin', 'super-admin'] },
  }).lean();

  // 4. Create recipients and emit
  const recipientPromises = admins.map(async (admin) => {
    const recipient = await NotificationRecipient.create({
      notification: notification._id,
      recipient: admin._id,
      metadata,
      is_read: false,
    });

    // Populate for socket emission
    const populatedRecipient = await NotificationRecipient.findById(
      recipient._id,
    )
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

/**
 * Unified helper to send notification to a specific user
 * Both persists in DB and emits via Socket.io
 */
export const notifyUser = async (
  userId: string,
  payload: Pick<TNotification, 'title' | 'message' | 'url' | 'metadata'>,
  metadata: TNotificationMetadata = {},
): Promise<void> => {
  const systemUser = await User.findOne({ role: 'super-admin' }).lean();
  if (!systemUser) return;

  const notification = await Notification.create({
    ...payload,
    type: 'request',
    channels: ['web'],
    sender: systemUser._id,
  });

  const recipient = await NotificationRecipient.create({
    notification: notification._id,
    recipient: userId,
    metadata,
    is_read: false,
  });

  const populatedRecipient = await NotificationRecipient.findById(recipient._id)
    .populate('notification')
    .lean();

  emitToUser(userId, 'notification-recipient-created', populatedRecipient);
};
