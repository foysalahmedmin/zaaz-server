import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as PaymentTransactionServices from './payment-transaction.service';

export const createPaymentTransaction = catchAsync(async (req, res) => {
  const result = await PaymentTransactionServices.createPaymentTransaction(
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Payment transaction created successfully',
    data: result,
  });
});

export const updatePaymentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result =
    await PaymentTransactionServices.updatePaymentTransactionStatus(id, status);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction updated successfully',
    data: result,
  });
});

export const getMyPaymentTransactions = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await PaymentTransactionServices.getPaymentTransactions({
    ...req.query,
    user: userId,
  });
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPaymentTransactions = catchAsync(async (req, res) => {
  const result = await PaymentTransactionServices.getPaymentTransactions(
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPaymentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentTransactionServices.getPaymentTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction retrieved successfully',
    data: result,
  });
});

export const deletePaymentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PaymentTransactionServices.deletePaymentTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction deleted successfully',
    data: null,
  });
});

