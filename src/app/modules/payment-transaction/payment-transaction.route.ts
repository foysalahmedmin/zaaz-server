import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PaymentTransactionControllers from './payment-transaction.controller';
import * as PaymentTransactionValidations from './payment-transaction.validation';

const router = express.Router();

// GET
router.get(
  '/me',
  auth('user', 'admin'),
  validation(
    PaymentTransactionValidations.getPaymentTransactionsValidationSchema,
  ),
  PaymentTransactionControllers.getMyPaymentTransactions,
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
  '/:id',
  auth('admin'),
  validation(
    PaymentTransactionValidations.paymentTransactionOperationValidationSchema,
  ),
  PaymentTransactionControllers.getPaymentTransaction,
);

// POST
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

