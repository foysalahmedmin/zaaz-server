import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TokenProfitHistoryControllers from './token-profit-history.controller';
import * as TokenProfitHistoryValidations from './token-profit-history.validation';

const router = express.Router();

// GET
router.get(
  '/token-profit/:tokenProfitId',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.getTokenProfitHistoryValidationSchema,
  ),
  TokenProfitHistoryControllers.getTokenProfitHistories,
);

router.get(
  '/:id',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.tokenProfitHistoryOperationValidationSchema,
  ),
  TokenProfitHistoryControllers.getTokenProfitHistory,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.tokenProfitHistoriesOperationValidationSchema,
  ),
  TokenProfitHistoryControllers.deleteTokenProfitHistoriesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.tokenProfitHistoriesOperationValidationSchema,
  ),
  TokenProfitHistoryControllers.deleteTokenProfitHistories,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.tokenProfitHistoryOperationValidationSchema,
  ),
  TokenProfitHistoryControllers.deleteTokenProfitHistoryPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.tokenProfitHistoryOperationValidationSchema,
  ),
  TokenProfitHistoryControllers.deleteTokenProfitHistory,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.tokenProfitHistoriesOperationValidationSchema,
  ),
  TokenProfitHistoryControllers.restoreTokenProfitHistories,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    TokenProfitHistoryValidations.tokenProfitHistoryOperationValidationSchema,
  ),
  TokenProfitHistoryControllers.restoreTokenProfitHistory,
);

const TokenProfitHistoryRoutes = router;

export default TokenProfitHistoryRoutes;
