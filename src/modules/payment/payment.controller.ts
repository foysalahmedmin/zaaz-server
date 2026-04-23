import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as PaymentService from './payment.service';
import * as ReconciliationService from './payment-reconciliation.service';

export const initiatePayment = catchAsync(async (req, res) => {
  const user_id = req.user._id;
  const {
    package: package_id,
    interval: interval_id,
    payment_method: payment_method_id,
    return_url,
    cancel_url,
    customer_email,
    customer_name,
    customer_phone,
    currency,
    coupon: coupon_code,
  } = req.body;

  const final_customer_email = customer_email || req.user.email;
  const final_customer_name = customer_name || req.user.name;
  const final_customer_phone = customer_phone || req.user.phone;

  const result = await PaymentService.initiatePayment({
    user_id,
    package_id,
    interval_id,
    payment_method_id,
    return_url,
    cancel_url,
    customer_email: final_customer_email,
    customer_name: final_customer_name,
    customer_phone: final_customer_phone,
    currency,
    coupon_code,
  });

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment initiated successfully',
    data: result,
  });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.role === 'admin' ? undefined : req.user._id;

  const result = await PaymentService.verifyPayment(id, undefined, user_id);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment verification completed',
    data: result,
  });
});

export const handleWebhook = catchAsync(async (req, res) => {
  const { payment_method_id } = req.params;

  const signature =
    (req.headers['stripe-signature'] as string) ||
    (req.headers['x-signature'] as string) ||
    '';

  const raw_body = (req as any).rawBody;
  const content_type = req.headers['content-type'] || '';
  const is_stripe = content_type.includes('application/json') && signature.includes('t=');

  let payload: any;
  if (is_stripe) {
    payload = Buffer.isBuffer(raw_body)
      ? raw_body
      : raw_body
        ? Buffer.from(typeof raw_body === 'string' ? raw_body : JSON.stringify(raw_body))
        : (req as any).body;
  } else {
    payload = (req as any).body || raw_body;
  }

  try {
    await PaymentService.handlePaymentWebhook(payment_method_id, payload, signature);

    responseFormatter(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Webhook processed successfully',
      data: null,
    });
  } catch (error: any) {
    const status_code =
      error.status === httpStatus.NOT_FOUND || error.status === httpStatus.BAD_REQUEST
        ? httpStatus.OK
        : httpStatus.INTERNAL_SERVER_ERROR;

    responseFormatter(res, {
      status: status_code,
      success: false,
      message: error.message || 'Webhook processing failed',
      data: null,
    });
  }
});

export const handleRedirect = catchAsync(async (req, res) => {
  try {
    const params = { ...req.query, ...req.body };
    const result = await PaymentService.handlePaymentRedirect(params);
    return res.redirect(result.redirect_url);
  } catch (error: any) {
    return res.redirect('/');
  }
});

export const reconcileTransactions = catchAsync(async (_req, res) => {
  const result = await ReconciliationService.reconcilePendingTransactions();
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment reconciliation job completed',
    data: result,
  });
});

export const createPayment = catchAsync(async (req, res) => {
  const result = await PaymentService.createPaymentTransaction(req.body);
  responseFormatter(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Payment transaction created successfully',
    data: result,
  });
});

export const updatePayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await PaymentService.updatePaymentTransactionStatus(id, status);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment transaction updated successfully',
    data: result,
  });
});

export const refundPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { admin_note } = req.body;
  const result = await PaymentService.initiateRefund(id, admin_note);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Payment refunded successfully',
    data: result,
  });
});
