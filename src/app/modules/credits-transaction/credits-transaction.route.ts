import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as CreditsTransactionControllers from './credits-transaction.controller';
import * as CreditsTransactionValidations from './credits-transaction.validation';

const router = express.Router();

// GET
router.get(
  '/self',
  auth('user', 'admin'),
  validation(
    CreditsTransactionValidations.getCreditsTransactionsValidationSchema,
  ),
  CreditsTransactionControllers.getSelfCreditsTransactions,
);
router.get(
  '/',
  auth('admin'),
  validation(
    CreditsTransactionValidations.getCreditsTransactionsValidationSchema,
  ),
  CreditsTransactionControllers.getCreditsTransactions,
);
router.get(
  '/:id',
  auth('admin'),
  validation(
    CreditsTransactionValidations.creditsTransactionOperationValidationSchema,
  ),
  CreditsTransactionControllers.getCreditsTransaction,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(
    CreditsTransactionValidations.createCreditsTransactionValidationSchema,
  ),
  CreditsTransactionControllers.createCreditsTransaction,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    CreditsTransactionValidations.creditsTransactionsOperationValidationSchema,
  ),
  CreditsTransactionControllers.deleteCreditsTransactionsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    CreditsTransactionValidations.creditsTransactionsOperationValidationSchema,
  ),
  CreditsTransactionControllers.deleteCreditsTransactions,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    CreditsTransactionValidations.creditsTransactionOperationValidationSchema,
  ),
  CreditsTransactionControllers.deleteCreditsTransactionPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    CreditsTransactionValidations.creditsTransactionOperationValidationSchema,
  ),
  CreditsTransactionControllers.deleteCreditsTransaction,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    CreditsTransactionValidations.creditsTransactionsOperationValidationSchema,
  ),
  CreditsTransactionControllers.restoreCreditsTransactions,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    CreditsTransactionValidations.creditsTransactionOperationValidationSchema,
  ),
  CreditsTransactionControllers.restoreCreditsTransaction,
);

const CreditsTransactionRoutes = router;

export default CreditsTransactionRoutes;
