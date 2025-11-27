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

// GET/POST - Redirect handler (no auth, called by payment gateways)
// MUST be placed before parameterized routes (/:id) to avoid route conflicts
// Supports both GET (SSLCommerz) and POST (Stripe) redirects
router.get('/redirect', PaymentTransactionControllers.handleRedirect);
router.post(
  '/redirect',
  express.urlencoded({ extended: true }),
  express.json(),
  PaymentTransactionControllers.handleRedirect,
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
    type: [
      'application/json',
      'application/x-www-form-urlencoded',
      'text/plain',
    ],
    verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
      // Store raw body buffer BEFORE any parsing (Stripe needs this for signature verification)
      (req as any).rawBody = buf;
    },
  }),
  (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    // req.body is now a Buffer from express.raw()
    // Store raw body for signature verification (Stripe needs this)
    if (!(req as any).rawBody) {
      (req as any).rawBody = req.body;
    }

    // Parse body based on content type
    try {
      // Check if body is already a Buffer
      const bodyBuffer = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(String(req.body));
      const bodyString = bodyBuffer.toString('utf8');
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        // Parse as JSON
        try {
          (req as any).body = JSON.parse(bodyString);
        } catch (parseError) {
          // If JSON parsing fails, keep as raw buffer
          console.warn(
            '[Webhook Route] JSON parse failed, keeping raw body:',
            parseError,
          );
          (req as any).body = bodyBuffer;
        }
      } else if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('text/plain')
      ) {
        // Parse as URL-encoded form data (SSLCommerz)
        try {
          const params = new URLSearchParams(bodyString);
          (req as any).body = Object.fromEntries(params);
        } catch (parseError) {
          // If parsing fails, keep as raw buffer
          console.warn(
            '[Webhook Route] Form data parse failed, keeping raw body:',
            parseError,
          );
          (req as any).body = bodyBuffer;
        }
      } else {
        // Unknown content type, try to parse as form data (SSLCommerz sometimes doesn't set content-type)
        try {
          const params = new URLSearchParams(bodyString);
          (req as any).body = Object.fromEntries(params);
        } catch {
          // If all parsing fails, keep as raw buffer
          (req as any).body = bodyBuffer;
        }
      }
    } catch (error) {
      console.error('[Webhook Route] Body processing error:', error);
      // If processing fails, keep raw body as buffer
      (req as any).body = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(String(req.body));
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
  '/bulk/permanent',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionsOperationValidationSchema,
  ),
  PaymentTransactionControllers.deletePaymentTransactionsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionsOperationValidationSchema,
  ),
  PaymentTransactionControllers.deletePaymentTransactions,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.deletePaymentTransactionPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.deletePaymentTransaction,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionsOperationValidationSchema,
  ),
  PaymentTransactionControllers.restorePaymentTransactions,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.restorePaymentTransaction,
);

const PaymentTransactionRoutes = router;

export default PaymentTransactionRoutes;
