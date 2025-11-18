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

const TokenProfitHistoryRoutes = router;

export default TokenProfitHistoryRoutes;

