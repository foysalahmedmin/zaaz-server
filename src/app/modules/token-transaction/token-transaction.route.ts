import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TokenTransactionControllers from './token-transaction.controller';
import * as TokenTransactionValidations from './token-transaction.validation';

const router = express.Router();

// GET
router.get(
  '/self',
  auth('user', 'admin'),
  validation(TokenTransactionValidations.getTokenTransactionsValidationSchema),
  TokenTransactionControllers.getSelfTokenTransactions,
);
router.get(
  '/',
  auth('admin'),
  validation(TokenTransactionValidations.getTokenTransactionsValidationSchema),
  TokenTransactionControllers.getTokenTransactions,
);
router.get(
  '/:id',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionOperationValidationSchema,
  ),
  TokenTransactionControllers.getTokenTransaction,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(
    TokenTransactionValidations.createTokenTransactionValidationSchema,
  ),
  TokenTransactionControllers.createTokenTransaction,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionsOperationValidationSchema,
  ),
  TokenTransactionControllers.deleteTokenTransactionsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionsOperationValidationSchema,
  ),
  TokenTransactionControllers.deleteTokenTransactions,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionOperationValidationSchema,
  ),
  TokenTransactionControllers.deleteTokenTransactionPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionOperationValidationSchema,
  ),
  TokenTransactionControllers.deleteTokenTransaction,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionsOperationValidationSchema,
  ),
  TokenTransactionControllers.restoreTokenTransactions,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionOperationValidationSchema,
  ),
  TokenTransactionControllers.restoreTokenTransaction,
);

const TokenTransactionRoutes = router;

export default TokenTransactionRoutes;
