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

// POST - Reconcile pending transactions (admin only)
router.post(
  '/reconcile',
  auth('admin'),
  PaymentTransactionControllers.reconcileTransactions,
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
      // CRITICAL: This must be called before any body parsing
      (req as any).rawBody = buf;
      console.log('[Webhook Route] Raw body captured in verify callback:', {
        bufferLength: buf.length,
        contentType: req.headers['content-type'],
        hasRawBody: !!(req as any).rawBody,
      });
    },
  }),
  (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    // Log initial state for debugging
    console.log('[Webhook Route] Middleware received request:', {
      hasRawBody: !!(req as any).rawBody,
      isBodyBuffer: Buffer.isBuffer(req.body),
      bodyType: typeof req.body,
      contentType: req.headers['content-type'],
      rawBodyType: (req as any).rawBody
        ? typeof (req as any).rawBody
        : 'undefined',
      rawBodyIsBuffer: (req as any).rawBody
        ? Buffer.isBuffer((req as any).rawBody)
        : false,
    });

    // req.body should be a Buffer from express.raw()
    // Store raw body for signature verification (Stripe needs this)
    // CRITICAL: Must store the Buffer BEFORE any parsing
    if (!(req as any).rawBody) {
      if (Buffer.isBuffer(req.body)) {
        // express.raw() worked, use req.body as rawBody
        (req as any).rawBody = req.body;
        console.log(
          '[Webhook Route] Using req.body as rawBody (Buffer from express.raw())',
        );
      } else {
        // If body is not a Buffer, something went wrong
        // This means express.raw() didn't work or body was parsed before reaching here
        console.error(
          '[Webhook Route] CRITICAL: req.body is not a Buffer, express.raw() may have failed',
          {
            bodyType: typeof req.body,
            bodyValue: typeof req.body === 'object' ? 'object' : req.body,
            contentType: req.headers['content-type'],
          },
        );
        // Try to reconstruct it, but this is not ideal for Stripe
        // This will likely cause signature verification to fail
        (req as any).rawBody = Buffer.from(
          typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
        );
        console.warn(
          '[Webhook Route] Attempted to reconstruct raw body (signature verification may fail)',
        );
      }
    } else {
      console.log(
        '[Webhook Route] rawBody already set from verify callback (good!)',
      );
    }

    // Parse body based on content type
    try {
      const contentType = req.headers['content-type'] || '';

      // If body is already an object (shouldn't happen with express.raw(), but handle it)
      if (
        typeof req.body === 'object' &&
        !Buffer.isBuffer(req.body) &&
        req.body !== null
      ) {
        // Body is already parsed, use it as-is
        // But ensure rawBody is set for Stripe
        if (!(req as any).rawBody || !Buffer.isBuffer((req as any).rawBody)) {
          (req as any).rawBody = Buffer.from(JSON.stringify(req.body));
        }
        (req as any).body = req.body;
      } else {
        // Body is a Buffer, parse it based on content type
        const bodyBuffer = Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from(String(req.body));
        const bodyString = bodyBuffer.toString('utf8');

        // Prevent parsing "[object Object]" string
        if (bodyString === '[object Object]') {
          console.warn(
            '[Webhook Route] Body string is "[object Object]", keeping as buffer',
          );
          (req as any).body = bodyBuffer;
        } else if (contentType.includes('application/json')) {
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
