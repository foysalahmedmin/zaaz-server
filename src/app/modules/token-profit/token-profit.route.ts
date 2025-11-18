import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TokenProfitControllers from './token-profit.controller';
import * as TokenProfitValidations from './token-profit.validation';

const router = express.Router();

// GET
router.get('/public', TokenProfitControllers.getPublicTokenProfits);
router.get('/', auth('admin'), TokenProfitControllers.getTokenProfits);

router.get('/:id/public', TokenProfitControllers.getPublicTokenProfit);
router.get(
  '/:id',
  auth('admin'),
  validation(TokenProfitValidations.tokenProfitOperationValidationSchema),
  TokenProfitControllers.getTokenProfit,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(TokenProfitValidations.updateTokenProfitsValidationSchema),
  TokenProfitControllers.updateTokenProfits,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(TokenProfitValidations.updateTokenProfitValidationSchema),
  TokenProfitControllers.updateTokenProfit,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(TokenProfitValidations.tokenProfitsOperationValidationSchema),
  TokenProfitControllers.deleteTokenProfitsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(TokenProfitValidations.tokenProfitsOperationValidationSchema),
  TokenProfitControllers.deleteTokenProfits,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(TokenProfitValidations.tokenProfitOperationValidationSchema),
  TokenProfitControllers.deleteTokenProfitPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(TokenProfitValidations.tokenProfitOperationValidationSchema),
  TokenProfitControllers.deleteTokenProfit,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(TokenProfitValidations.createTokenProfitValidationSchema),
  TokenProfitControllers.createTokenProfit,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(TokenProfitValidations.tokenProfitsOperationValidationSchema),
  TokenProfitControllers.restoreTokenProfits,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(TokenProfitValidations.tokenProfitOperationValidationSchema),
  TokenProfitControllers.restoreTokenProfit,
);

const TokenProfitRoutes = router;

export default TokenProfitRoutes;

