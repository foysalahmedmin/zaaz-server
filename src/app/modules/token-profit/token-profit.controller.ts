import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as TokenProfitServices from './token-profit.service';

export const createTokenProfit = catchAsync(async (req, res) => {
  const result = await TokenProfitServices.createTokenProfit(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit created successfully',
    data: result,
  });
});

export const getPublicTokenProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenProfitServices.getPublicTokenProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit retrieved successfully',
    data: result,
  });
});

export const getTokenProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenProfitServices.getTokenProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit retrieved successfully',
    data: result,
  });
});

export const getPublicTokenProfits = catchAsync(async (req, res) => {
  const result = await TokenProfitServices.getPublicTokenProfits(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profits retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTokenProfits = catchAsync(async (req, res) => {
  const result = await TokenProfitServices.getTokenProfits(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profits retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateTokenProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenProfitServices.updateTokenProfit(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit updated successfully',
    data: result,
  });
});

export const updateTokenProfits = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await TokenProfitServices.updateTokenProfits(ids, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profits updated successfully',
    data: result,
  });
});

export const deleteTokenProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  await TokenProfitServices.deleteTokenProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit soft deleted successfully',
    data: null,
  });
});

export const deleteTokenProfitPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await TokenProfitServices.deleteTokenProfitPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit permanently deleted successfully',
    data: null,
  });
});

export const deleteTokenProfits = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await TokenProfitServices.deleteTokenProfits(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token profits soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteTokenProfitsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await TokenProfitServices.deleteTokenProfitsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token profits permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreTokenProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenProfitServices.restoreTokenProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit restored successfully',
    data: result,
  });
});

export const restoreTokenProfits = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await TokenProfitServices.restoreTokenProfits(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token profits restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

