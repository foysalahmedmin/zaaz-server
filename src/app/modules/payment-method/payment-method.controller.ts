import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as PaymentMethodServices from './payment-method.service';

export const createPaymentMethod = catchAsync(async (req, res) => {
  const result = await PaymentMethodServices.createPaymentMethod(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment method created successfully',
    data: result,
  });
});

export const getPublicPaymentMethod = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentMethodServices.getPublicPaymentMethod(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment method retrieved successfully',
    data: result,
  });
});

export const getPaymentMethod = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentMethodServices.getPaymentMethod(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment method retrieved successfully',
    data: result,
  });
});

export const getPublicPaymentMethods = catchAsync(async (req, res) => {
  const result = await PaymentMethodServices.getPublicPaymentMethods(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment methods retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPaymentMethods = catchAsync(async (req, res) => {
  const result = await PaymentMethodServices.getPaymentMethods(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment methods retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updatePaymentMethod = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentMethodServices.updatePaymentMethod(
    id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment method updated successfully',
    data: result,
  });
});

export const updatePaymentMethods = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await PaymentMethodServices.updatePaymentMethods(
    ids,
    payload,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment methods updated successfully',
    data: result,
  });
});

export const deletePaymentMethod = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PaymentMethodServices.deletePaymentMethod(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment method soft deleted successfully',
    data: null,
  });
});

export const deletePaymentMethodPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PaymentMethodServices.deletePaymentMethodPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment method permanently deleted successfully',
    data: null,
  });
});

export const deletePaymentMethods = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PaymentMethodServices.deletePaymentMethods(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment methods soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deletePaymentMethodsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PaymentMethodServices.deletePaymentMethodsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment methods permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restorePaymentMethod = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentMethodServices.restorePaymentMethod(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment method restored successfully',
    data: result,
  });
});

export const restorePaymentMethods = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PaymentMethodServices.restorePaymentMethods(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment methods restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

