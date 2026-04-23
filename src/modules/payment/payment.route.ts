import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PaymentControllers from './payment.controller';
import * as PaymentValidations from './payment.validator';
import { parseWebhookBody } from './payment-webhook-body-parser.middleware';

const router = express.Router();

// POST - Initiate payment (user/admin)
router.post(
  '/initiate',
  auth('user', 'admin'),
  validation(PaymentValidations.initiatePaymentValidationSchema),
  PaymentControllers.initiatePayment,
);

// POST - Verify payment (user/admin)
router.post(
  '/:id/verify',
  auth('user', 'admin'),
  validation(PaymentValidations.paymentOperationValidationSchema),
  PaymentControllers.verifyPayment,
);

// GET/POST - Redirect handler (no auth — called by payment gateways)
// Must be before /:id to avoid route conflict
router.get('/redirect', PaymentControllers.handleRedirect);
router.post(
  '/redirect',
  express.urlencoded({ extended: true }),
  express.json(),
  PaymentControllers.handleRedirect,
);

// POST - Webhook handler (no auth — called by payment gateways)
router.post(
  '/webhook/:payment_method_id',
  express.raw({
    type: ['application/json', 'application/x-www-form-urlencoded', 'text/plain'],
    verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
      // Capture raw buffer before any parsing — Stripe requires this for signature verification
      (req as any).rawBody = buf;
    },
  }),
  parseWebhookBody,
  PaymentControllers.handleWebhook,
);

// POST - Reconcile pending transactions (admin only)
router.post('/reconcile', auth('admin'), PaymentControllers.reconcileTransactions);

// POST - Admin direct create
router.post(
  '/',
  auth('admin'),
  validation(PaymentValidations.createPaymentValidationSchema),
  PaymentControllers.createPayment,
);

// PATCH - Admin status update
router.patch(
  '/:id',
  auth('admin'),
  validation(PaymentValidations.updatePaymentValidationSchema),
  PaymentControllers.updatePayment,
);

const PaymentRoutes = router;
export default PaymentRoutes;
