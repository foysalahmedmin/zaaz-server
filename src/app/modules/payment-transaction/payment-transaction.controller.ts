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

export const initiatePayment = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const {
    package: packageId,
    payment_method: paymentMethodId,
    return_url: returnUrl,
    cancel_url: cancelUrl,
  } = req.body;

  const result = await PaymentTransactionServices.initiatePayment(
    userId,
    packageId,
    paymentMethodId,
    returnUrl,
    cancelUrl,
  );

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment initiated successfully',
    data: result,
  });
});

export const handleWebhook = catchAsync(async (req, res) => {
  const { payment_method_id } = req.params;
  
  // Get signature from headers (Stripe uses 'stripe-signature', SSL Commerz might use 'x-signature')
  const signature =
    (req.headers['stripe-signature'] as string) ||
    (req.headers['x-signature'] as string) ||
    '';

  // For Stripe, use raw body if available, otherwise use parsed body
  // For SSL Commerz, use parsed body (form data)
  const payload = (req as any).rawBody || req.body;

  await PaymentTransactionServices.handlePaymentWebhook(
    payment_method_id,
    payload,
    signature,
  );

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Webhook processed successfully',
    data: null,
  });
});

