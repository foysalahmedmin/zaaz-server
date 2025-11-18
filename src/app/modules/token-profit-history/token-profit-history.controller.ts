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

