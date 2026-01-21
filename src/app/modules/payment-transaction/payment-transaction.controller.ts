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
    message: 'Payment transaction soft deleted successfully',
    data: null,
  });
});

export const deletePaymentTransactionPermanent = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    await PaymentTransactionServices.deletePaymentTransactionPermanent(id);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Payment transaction permanently deleted successfully',
      data: null,
    });
  },
);

export const deletePaymentTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await PaymentTransactionServices.deletePaymentTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment transactions soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deletePaymentTransactionsPermanent = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await PaymentTransactionServices.deletePaymentTransactionsPermanent(ids);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} payment transactions permanently deleted successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restorePaymentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentTransactionServices.restorePaymentTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction restored successfully',
    data: result,
  });
});

export const restorePaymentTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await PaymentTransactionServices.restorePaymentTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} payment transactions restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const initiatePayment = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const {
    package: packageId,
    plan: planId,
    payment_method: paymentMethodId,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    customer_name: customerName,
    customer_phone: customerPhone,
    coupon: couponCode,
  } = req.body;

  // Use user info from JWT if customer info not provided
  const finalCustomerEmail = customerEmail || req.user.email;
  const finalCustomerName = customerName || req.user.name;
  const finalCustomerPhone = customerPhone || req.user.phone;

  const result = await PaymentTransactionServices.initiatePayment({
    userId,
    packageId,
    planId,
    paymentMethodId,
    returnUrl,
    cancelUrl,
    customerEmail: finalCustomerEmail,
    customerName: finalCustomerName,
    customerPhone: finalCustomerPhone,
    coupon_code: couponCode,
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

  // Get raw body buffer (for Stripe signature verification)
  // This should be captured by express.raw() verify option
  // CRITICAL: For Stripe, we MUST use the raw Buffer, not the parsed body
  const rawBody = (req as any).rawBody;

  // Get parsed body (for SSLCommerz form data or general use)
  // For Stripe, we need to pass raw body buffer for signature verification
  // For SSLCommerz, we use parsed form data
  const contentType = req.headers['content-type'] || '';
  const isStripe =
    contentType.includes('application/json') && signature.includes('t=');

  // For Stripe: MUST use raw body buffer for signature verification
  // For SSLCommerz: use parsed body (form data)
  // Ensure rawBody is a Buffer for Stripe
  let payload: any;
  if (isStripe) {
    // Stripe requires raw Buffer for signature verification
    if (Buffer.isBuffer(rawBody)) {
      payload = rawBody;
    } else if (rawBody) {
      // Fallback: try to reconstruct Buffer (not ideal, but better than nothing)
      payload = Buffer.from(
        typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      );
    } else {
      // No rawBody available, use parsed body (signature verification will likely fail)
      payload = (req as any).body;
    }
  } else {
    // SSLCommerz: use parsed form data
    payload = (req as any).body || rawBody;
  }

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

// Handle redirect for both GET and POST (Stripe and SSLCommerz)
export const handleRedirect = catchAsync(async (req, res) => {
  try {
    // Support both GET (query params) and POST (body params)
    const params = {
      ...req.query,
      ...req.body,
    };

    const result =
      await PaymentTransactionServices.handlePaymentRedirect(params);

    // Redirect to frontend URL
    return res.redirect(result.redirectUrl);
  } catch (error: any) {
    // If error occurs, redirect to home or return error page
    if (error.status === httpStatus.NOT_FOUND) {
      return res.status(httpStatus.NOT_FOUND).redirect('/');
    }
    if (error.status === httpStatus.BAD_REQUEST) {
      return res.status(httpStatus.BAD_REQUEST).redirect('/');
    }
    // For other errors, redirect to home
    return res.redirect('/');
  }
});
