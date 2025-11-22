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

export const getSelfPaymentTransactions = catchAsync(async (req, res) => {
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
    customer_email: customerEmail,
    customer_name: customerName,
    customer_phone: customerPhone,
  } = req.body;

  // Use user info from JWT if customer info not provided
  const finalCustomerEmail = customerEmail || req.user.email;
  const finalCustomerName = customerName || req.user.name;
  const finalCustomerPhone = customerPhone || req.user.phone || '01700000000'; // Default Bangladesh phone format

  const result = await PaymentTransactionServices.initiatePayment({
    userId,
    packageId,
    paymentMethodId,
    returnUrl,
    cancelUrl,
    customerEmail: finalCustomerEmail,
    customerName: finalCustomerName,
    customerPhone: finalCustomerPhone,
  });

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
  const payload = (req as any).body || (req as any).rawBody;

  // Add logging for debugging SSLCommerz webhook
  console.log('[Webhook Controller] Payment Method ID:', payment_method_id);
  console.log('[Webhook Controller] Payload type:', typeof payload);
  console.log(
    '[Webhook Controller] Payload is object:',
    typeof payload === 'object',
  );
  console.log(
    '[Webhook Controller] Payload keys:',
    payload && typeof payload === 'object'
      ? Object.keys(payload)
      : 'Not an object',
  );
  console.log(
    '[Webhook Controller] Payload sample:',
    JSON.stringify(payload, null, 2).substring(0, 500),
  );

  try {
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
  } catch (error: any) {
    // Log error but still return 200 to prevent gateway retries for invalid requests
    // Only return error status for critical issues that need retry
    console.error(
      `[Webhook] Error processing webhook for payment method ${payment_method_id}:`,
      error.message,
    );

    // Return 200 OK for validation errors to prevent gateway retries
    // Return 500 for unexpected errors that might need retry
    const statusCode =
      error.status === httpStatus.NOT_FOUND ||
      error.status === httpStatus.BAD_REQUEST
        ? httpStatus.OK
        : httpStatus.INTERNAL_SERVER_ERROR;

    sendResponse(res, {
      status: statusCode,
      success: false,
      message: error.message || 'Webhook processing failed',
      data: null,
    });
  }
});

export const getPaymentTransactionStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await PaymentTransactionServices.getPaymentTransactionStatus(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction status retrieved successfully',
    data: result,
  });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentTransactionServices.verifyPayment(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment verification completed',
    data: result,
  });
});
