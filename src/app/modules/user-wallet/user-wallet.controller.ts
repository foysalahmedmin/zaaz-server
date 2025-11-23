import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as UserWalletServices from './user-wallet.service';

export const getSelfWallet = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await UserWalletServices.getUserWallet(userId);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallet retrieved successfully',
    data: result,
  });
});

export const getUserWallet = catchAsync(async (req, res) => {
  const userId = req.params.user_id || req.user._id;
  const result = await UserWalletServices.getUserWallet(userId);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallet retrieved successfully',
    data: result,
  });
});

export const getUserWallets = catchAsync(async (req, res) => {
  const result = await UserWalletServices.getUserWallets(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallets retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getUserWalletById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserWalletServices.getUserWalletById(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallet retrieved successfully',
    data: result,
  });
});

export const createUserWallet = catchAsync(async (req, res) => {
  const result = await UserWalletServices.createUserWallet(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'User wallet created successfully',
    data: result,
  });
});

export const updateUserWallet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserWalletServices.updateUserWallet(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallet updated successfully',
    data: result,
  });
});

export const deleteUserWallet = catchAsync(async (req, res) => {
  const { id } = req.params;
  await UserWalletServices.deleteUserWallet(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallet soft deleted successfully',
    data: null,
  });
});

export const deleteUserWalletPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await UserWalletServices.deleteUserWalletPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallet permanently deleted successfully',
    data: null,
  });
});

export const deleteUserWallets = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await UserWalletServices.deleteUserWallets(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} user wallets soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteUserWalletsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await UserWalletServices.deleteUserWalletsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} user wallets permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreUserWallet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserWalletServices.restoreUserWallet(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User wallet restored successfully',
    data: result,
  });
});

export const restoreUserWallets = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await UserWalletServices.restoreUserWallets(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} user wallets restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
