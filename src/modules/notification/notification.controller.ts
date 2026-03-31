import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as NotificationServices from './notification.service';

export const createNotification = catchAsync(async (req, res) => {
  const result = await NotificationServices.createNotification(req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification created successfully',
    data: result,
  });
});

export const getNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NotificationServices.getNotification(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification retrieved successfully',
    data: result,
  });
});

export const getNotifications = catchAsync(async (req, res) => {
  const result = await NotificationServices.getNotifications(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NotificationServices.updateNotification(id, req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification updated successfully',
    data: result,
  });
});

export const updateNotifications = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await NotificationServices.updateNotifications(ids, payload);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notifications updated successfully',
    data: result,
  });
});

export const deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  await NotificationServices.deleteNotification(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification soft deleted successfully',
    data: null,
  });
});

export const deleteNotificationPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await NotificationServices.deleteNotificationPermanent(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification permanently deleted successfully',
    data: null,
  });
});

export const deleteNotifications = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await NotificationServices.deleteNotifications(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} notifications soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteNotificationsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await NotificationServices.deleteNotificationsPermanent(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} notifications permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NotificationServices.restoreNotification(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification restored successfully',
    data: result,
  });
});

export const restoreNotifications = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await NotificationServices.restoreNotifications(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} notifications restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});


