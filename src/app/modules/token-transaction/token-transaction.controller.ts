import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as TokenTransactionServices from './token-transaction.service';

export const createTokenTransaction = catchAsync(async (req, res) => {
  const result = await TokenTransactionServices.createTokenTransaction(
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Token transaction created successfully',
    data: result,
  });
});

export const getMyTokenTransactions = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await TokenTransactionServices.getTokenTransactions({
    ...req.query,
    user: userId,
  });
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTokenTransactions = catchAsync(async (req, res) => {
  const result = await TokenTransactionServices.getTokenTransactions(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTokenTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenTransactionServices.getTokenTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token transaction retrieved successfully',
    data: result,
  });
});

export const deleteTokenTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  await TokenTransactionServices.deleteTokenTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token transaction deleted successfully',
    data: null,
  });
});

