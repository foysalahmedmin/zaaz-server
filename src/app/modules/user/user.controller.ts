import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as UserServices from './user.service';

export const getSelf = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await UserServices.getUser(userId);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

export const getUser = catchAsync(async (req, res) => {
  const userId = req.params.id || req.user._id;
  const result = await UserServices.getUser(userId);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

export const getWritersUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getWritersUsers(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getUsers(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateSelf = catchAsync(async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const image = files.image?.[0]?.filename || '';

  const payload = {
    ...req.body,
    ...(image ? { image } : {}),
  };

  const result = await UserServices.updateSelf(req.user, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const files = req.files as Record<string, Express.Multer.File[]>;
  const image = files.image?.[0]?.filename || '';

  const payload = {
    ...req.body,
    ...(image ? { image } : {}),
  };

  const result = await UserServices.updateUser(id, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

export const updateUsers = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await UserServices.updateUsers(ids, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Users updated successfully',
    data: result,
  });
});

export const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  await UserServices.deleteUser(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User soft deleted successfully',
    data: null,
  });
});

export const deleteUserPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await UserServices.deleteUserPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User permanently deleted successfully',
    data: null,
  });
});

export const deleteUsers = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await UserServices.deleteUsers(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} users soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteUsersPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await UserServices.deleteUsersPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} users permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.restoreUser(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User restored successfully',
    data: result,
  });
});

export const restoreUsers = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await UserServices.restoreUsers(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} users restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
