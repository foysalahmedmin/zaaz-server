import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PaymentTransactionControllers from './payment-transaction.controller';
import * as PaymentTransactionValidations from './payment-transaction.validation';

const router = express.Router();

// GET
router.get(
  '/self',
  auth('user', 'admin'),
  validation(
    PaymentTransactionValidations.getPaymentTransactionsValidationSchema,
  ),
  PaymentTransactionControllers.getSelfPaymentTransactions,
);
router.get(
  '/',
  auth('admin'),
  validation(
    PaymentTransactionValidations.getPaymentTransactionsValidationSchema,
  ),
  PaymentTransactionControllers.getPaymentTransactions,
);
router.get(
  '/:id/status',
  auth('user', 'admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.getPaymentTransactionStatus,
);
router.get(
  '/:id',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.getPaymentTransaction,
);

// POST - Initiate payment
router.post(
  '/initiate',
  auth('user', 'admin'),
  validation(PaymentTransactionValidations.initiatePaymentValidationSchema),
  PaymentTransactionControllers.initiatePayment,
);

// POST - Verify payment
router.post(
  '/:id/verify',
  auth('user', 'admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.verifyPayment,
);

// POST - Webhook handler (no auth, handles both JSON and form data)
// Note: Webhook routes should be placed before other routes to avoid conflicts
router.post(
  '/webhook/:payment_method_id',
  express.raw({
    type: ['application/json', 'application/x-www-form-urlencoded'],
  }),
  (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    // Store raw body for signature verification (Stripe needs this)
    (req as any).rawBody = req.body;

    // Try to parse as JSON first, then as URL-encoded
    try {
      const bodyString = req.body.toString();
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        (req as any).body = JSON.parse(bodyString);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Parse as URL-encoded form data
        (req as any).body = Object.fromEntries(new URLSearchParams(bodyString));
      } else {
        // Keep as raw buffer
        (req as any).body = req.body;
      }
    } catch (error) {
      // If parsing fails, keep raw body
      (req as any).body = req.body;
    }
    next();
  },
  PaymentTransactionControllers.handleWebhook,
);

// POST - Create payment transaction (admin only)
router.post(
  '/',
  auth('admin'),
  validation(
    PaymentTransactionValidations.createPaymentTransactionValidationSchema,
  ),
  PaymentTransactionControllers.createPaymentTransaction,
);

// PATCH
router.patch(
  '/:id',
  auth('admin'),
  validation(
    PaymentTransactionValidations.updatePaymentTransactionValidationSchema,
  ),
  PaymentTransactionControllers.updatePaymentTransaction,
);

// DELETE
router.delete(
  '/:id',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.deletePaymentTransaction,
);

const PaymentTransactionRoutes = router;

export default PaymentTransactionRoutes;
