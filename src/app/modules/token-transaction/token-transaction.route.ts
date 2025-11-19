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
  '/:id',
  auth('admin'),
  validation(
    TokenTransactionValidations.tokenTransactionOperationValidationSchema,
  ),
  TokenTransactionControllers.deleteTokenTransaction,
);

const TokenTransactionRoutes = router;

export default TokenTransactionRoutes;
