import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
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

export const getSelfTokenTransactions = catchAsync(async (req, res) => {
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
    message: 'Token transaction soft deleted successfully',
    data: null,
  });
});

export const deleteTokenTransactionPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await TokenTransactionServices.deleteTokenTransactionPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token transaction permanently deleted successfully',
    data: null,
  });
});

export const deleteTokenTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await TokenTransactionServices.deleteTokenTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token transactions soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteTokenTransactionsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await TokenTransactionServices.deleteTokenTransactionsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token transactions permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreTokenTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TokenTransactionServices.restoreTokenTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token transaction restored successfully',
    data: result,
  });
});

export const restoreTokenTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await TokenTransactionServices.restoreTokenTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} token transactions restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
