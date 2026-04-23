import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as PaymentTransactionServices from './payment-transaction.service';

export const getSelfPaymentTransactions = catchAsync(async (req, res) => {
  const user_id = req.user._id;
  const result = await PaymentTransactionServices.getPaymentTransactions({
    ...req.query,
    user: user_id,
  });
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPaymentTransactions = catchAsync(async (req, res) => {
  const result = await PaymentTransactionServices.getPaymentTransactions(req.query);
  responseFormatter(res, {
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
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction retrieved successfully',
    data: result,
  });
});

export const getPaymentTransactionStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentTransactionServices.getPaymentTransactionStatus(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction status retrieved successfully',
    data: result,
  });
});

export const deletePaymentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PaymentTransactionServices.deletePaymentTransaction(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction soft deleted successfully',
    data: null,
  });
});

export const deletePaymentTransactionPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PaymentTransactionServices.deletePaymentTransactionPermanent(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction permanently deleted successfully',
    data: null,
  });
});

export const deletePaymentTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PaymentTransactionServices.deletePaymentTransactions(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment transactions soft deleted successfully`,
    data: { not_found_ids: result.not_found_ids },
  });
});

export const deletePaymentTransactionsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PaymentTransactionServices.deletePaymentTransactionsPermanent(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment transactions permanently deleted successfully`,
    data: { not_found_ids: result.not_found_ids },
  });
});

export const restorePaymentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentTransactionServices.restorePaymentTransaction(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction restored successfully',
    data: result,
  });
});

export const restorePaymentTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PaymentTransactionServices.restorePaymentTransactions(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment transactions restored successfully`,
    data: { not_found_ids: result.not_found_ids },
  });
});
