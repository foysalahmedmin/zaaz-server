import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as CreditsProfitControllers from './credits-profit.controller';
import * as CreditsProfitValidations from './credits-profit.validation';

const router = express.Router();

// GET
router.get('/public', CreditsProfitControllers.getPublicCreditsProfits);
router.get('/', auth('admin'), CreditsProfitControllers.getCreditsProfits);

router.get('/:id/public', CreditsProfitControllers.getPublicCreditsProfit);
router.get(
  '/:id',
  auth('admin'),
  validation(CreditsProfitValidations.creditsProfitOperationValidationSchema),
  CreditsProfitControllers.getCreditsProfit,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(CreditsProfitValidations.updateCreditsProfitsValidationSchema),
  CreditsProfitControllers.updateCreditsProfits,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(CreditsProfitValidations.updateCreditsProfitValidationSchema),
  CreditsProfitControllers.updateCreditsProfit,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(CreditsProfitValidations.creditsProfitsOperationValidationSchema),
  CreditsProfitControllers.deleteCreditsProfitsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(CreditsProfitValidations.creditsProfitsOperationValidationSchema),
  CreditsProfitControllers.deleteCreditsProfits,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(CreditsProfitValidations.creditsProfitOperationValidationSchema),
  CreditsProfitControllers.deleteCreditsProfitPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(CreditsProfitValidations.creditsProfitOperationValidationSchema),
  CreditsProfitControllers.deleteCreditsProfit,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(CreditsProfitValidations.createCreditsProfitValidationSchema),
  CreditsProfitControllers.createCreditsProfit,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(CreditsProfitValidations.creditsProfitsOperationValidationSchema),
  CreditsProfitControllers.restoreCreditsProfits,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(CreditsProfitValidations.creditsProfitOperationValidationSchema),
  CreditsProfitControllers.restoreCreditsProfit,
);

const CreditsProfitRoutes = router;

export default CreditsProfitRoutes;
