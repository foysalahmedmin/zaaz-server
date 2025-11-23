import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as TokenProfitHistoryServices from './token-profit-history.service';

export const getTokenProfitHistories = catchAsync(async (req, res) => {
  const { tokenProfitId } = req.params;
  const result = await TokenProfitHistoryServices.getTokenProfitHistories(
    tokenProfitId,
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit histories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTokenProfitHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenProfitHistoryServices.getTokenProfitHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit history retrieved successfully',
    data: result,
  });
});

export const deleteTokenProfitHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await TokenProfitHistoryServices.deleteTokenProfitHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit history soft deleted successfully',
    data: null,
  });
});

export const deleteTokenProfitHistoryPermanent = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    await TokenProfitHistoryServices.deleteTokenProfitHistoryPermanent(id);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Token profit history permanently deleted successfully',
      data: null,
    });
  },
);

export const deleteTokenProfitHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await TokenProfitHistoryServices.deleteTokenProfitHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token profit histories soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteTokenProfitHistoriesPermanent = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await TokenProfitHistoryServices.deleteTokenProfitHistoriesPermanent(ids);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} token profit histories permanently deleted successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restoreTokenProfitHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenProfitHistoryServices.restoreTokenProfitHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token profit history restored successfully',
    data: result,
  });
});

export const restoreTokenProfitHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await TokenProfitHistoryServices.restoreTokenProfitHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token profit histories restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
