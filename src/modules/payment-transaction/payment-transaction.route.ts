import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PaymentTransactionControllers from './payment-transaction.controller';
import * as PaymentTransactionValidations from './payment-transaction.validator';

const router = express.Router();

// GET
router.get(
  '/self',
  auth('user', 'admin'),
  validation(PaymentTransactionValidations.getPaymentTransactionsValidationSchema),
  PaymentTransactionControllers.getSelfPaymentTransactions,
);
router.get(
  '/',
  auth('admin'),
  validation(PaymentTransactionValidations.getPaymentTransactionsValidationSchema),
  PaymentTransactionControllers.getPaymentTransactions,
);
router.get(
  '/:id/status',
  auth('user', 'admin'),
  validation(PaymentTransactionValidations.paymentTransactionOperationValidationSchema),
  PaymentTransactionControllers.getPaymentTransactionStatus,
);
router.get(
  '/:id',
  auth('admin'),
  validation(PaymentTransactionValidations.paymentTransactionOperationValidationSchema),
  PaymentTransactionControllers.getPaymentTransaction,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(PaymentTransactionValidations.paymentTransactionsOperationValidationSchema),
  PaymentTransactionControllers.deletePaymentTransactionsPermanent,
);
router.delete(
  '/bulk',
  auth('admin'),
  validation(PaymentTransactionValidations.paymentTransactionsOperationValidationSchema),
  PaymentTransactionControllers.deletePaymentTransactions,
);
router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(PaymentTransactionValidations.paymentTransactionOperationValidationSchema),
  PaymentTransactionControllers.deletePaymentTransactionPermanent,
);
router.delete(
  '/:id',
  auth('admin'),
  validation(PaymentTransactionValidations.paymentTransactionOperationValidationSchema),
  PaymentTransactionControllers.deletePaymentTransaction,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(PaymentTransactionValidations.paymentTransactionsOperationValidationSchema),
  PaymentTransactionControllers.restorePaymentTransactions,
);
router.post(
  '/:id/restore',
  auth('admin'),
  validation(PaymentTransactionValidations.paymentTransactionOperationValidationSchema),
  PaymentTransactionControllers.restorePaymentTransaction,
);

const PaymentTransactionRoutes = router;
export default PaymentTransactionRoutes;
