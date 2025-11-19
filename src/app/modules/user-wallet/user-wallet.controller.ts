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
    message: 'User wallet deleted successfully',
    data: null,
  });
});
