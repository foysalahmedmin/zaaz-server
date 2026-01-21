import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as CreditsProfitHistoryControllers from './credits-profit-history.controller';
import * as CreditsProfitHistoryValidations from './credits-profit-history.validation';

const router = express.Router();

// GET
router.get(
  '/credits-profit/:creditsProfitId',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.getCreditsProfitHistoryValidationSchema,
  ),
  CreditsProfitHistoryControllers.getCreditsProfitHistories,
);

router.get(
  '/:id',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.creditsProfitHistoryOperationValidationSchema,
  ),
  CreditsProfitHistoryControllers.getCreditsProfitHistory,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.creditsProfitHistoriesOperationValidationSchema,
  ),
  CreditsProfitHistoryControllers.deleteCreditsProfitHistoriesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.creditsProfitHistoriesOperationValidationSchema,
  ),
  CreditsProfitHistoryControllers.deleteCreditsProfitHistories,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.creditsProfitHistoryOperationValidationSchema,
  ),
  CreditsProfitHistoryControllers.deleteCreditsProfitHistoryPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.creditsProfitHistoryOperationValidationSchema,
  ),
  CreditsProfitHistoryControllers.deleteCreditsProfitHistory,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.creditsProfitHistoriesOperationValidationSchema,
  ),
  CreditsProfitHistoryControllers.restoreCreditsProfitHistories,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    CreditsProfitHistoryValidations.creditsProfitHistoryOperationValidationSchema,
  ),
  CreditsProfitHistoryControllers.restoreCreditsProfitHistory,
);

const CreditsProfitHistoryRoutes = router;

export default CreditsProfitHistoryRoutes;
