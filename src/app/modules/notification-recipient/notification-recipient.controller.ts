import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as NotificationRecipientServices from './notification-recipient.service';

export const createNotificationRecipient = catchAsync(async (req, res) => {
  const result =
    await NotificationRecipientServices.createNotificationRecipient(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient created successfully',
    data: result,
  });
});

export const getSelfNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await NotificationRecipientServices.getSelfNotificationRecipient(
      req.user,
      id,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient retrieved successfully',
    data: result,
  });
});

export const getNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await NotificationRecipientServices.getNotificationRecipient(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient retrieved successfully',
    data: result,
  });
});

export const getSelfNotificationRecipients = catchAsync(async (req, res) => {
  const result =
    await NotificationRecipientServices.getSelfNotificationRecipients(
      req.user,
      req.query,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipients retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getNotificationRecipients = catchAsync(async (req, res) => {
  const result = await NotificationRecipientServices.getNotificationRecipients(
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipients retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateSelfNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await NotificationRecipientServices.updateSelfNotificationRecipient(
      req.user,
      id,
      req.body,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient updated successfully',
    data: result,
  });
});

export const updateNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await NotificationRecipientServices.updateNotificationRecipient(
      id,
      req.body,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient updated successfully',
    data: result,
  });
});

export const readAllNotificationRecipients = catchAsync(async (req, res) => {
  const result =
    await NotificationRecipientServices.readAllNotificationRecipients(req.user);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipients updated successfully',
    data: result,
  });
});

export const updateSelfNotificationRecipients = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result =
    await NotificationRecipientServices.updateSelfNotificationRecipients(
      req.user,
      ids,
      payload,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipients updated successfully',
    data: result,
  });
});

export const updateNotificationRecipients = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result =
    await NotificationRecipientServices.updateNotificationRecipients(
      ids,
      payload,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipients updated successfully',
    data: result,
  });
});

export const deleteSelfNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  await NotificationRecipientServices.deleteSelfNotificationRecipient(
    req.user,
    id,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient soft deleted successfully',
    data: null,
  });
});

export const deleteNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  await NotificationRecipientServices.deleteNotificationRecipient(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient soft deleted successfully',
    data: null,
  });
});

export const deleteNotificationRecipientPermanent = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    await NotificationRecipientServices.deleteNotificationRecipientPermanent(
      id,
    );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Notification recipient permanently deleted successfully',
      data: null,
    });
  },
);

export const deleteSelfNotificationRecipients = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await NotificationRecipientServices.deleteSelfNotificationRecipients(
      req.user,
      ids,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} notification recipients soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteAllSelfNotificationRecipients = catchAsync(
  async (req, res) => {
    const result =
      await NotificationRecipientServices.deleteAllSelfNotificationRecipients(
        req.user,
      );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'All notifications deleted successfully',
      data: result,
    });
  },
);

export const deleteNotificationRecipients = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await NotificationRecipientServices.deleteNotificationRecipients(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} notification recipients soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteNotificationRecipientsPermanent = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await NotificationRecipientServices.deleteNotificationRecipientsPermanent(
        ids,
      );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} notification recipients permanently deleted successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restoreSelfNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await NotificationRecipientServices.restoreSelfNotificationRecipient(
      req.user,
      id,
    );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient restored successfully',
    data: result,
  });
});

export const restoreNotificationRecipient = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await NotificationRecipientServices.restoreNotificationRecipient(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Notification recipient restored successfully',
    data: result,
  });
});

export const restoreSelfNotificationRecipients = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await NotificationRecipientServices.restoreSelfNotificationRecipients(
        req.user,
        ids,
      );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} notification recipients restored successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restoreNotificationRecipients = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await NotificationRecipientServices.restoreNotificationRecipients(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} notification recipients restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
