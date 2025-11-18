import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PackageHistoryControllers from './package-history.controller';
import * as PackageHistoryValidations from './package-history.validation';

const router = express.Router();

// GET
router.get(
  '/package/:packageId',
  auth('admin'),
  validation(PackageHistoryValidations.getPackageHistoryValidationSchema),
  PackageHistoryControllers.getPackageHistories,
);

router.get(
  '/:id',
  auth('admin'),
  validation(PackageHistoryValidations.packageHistoryOperationValidationSchema),
  PackageHistoryControllers.getPackageHistory,
);

const PackageHistoryRoutes = router;

export default PackageHistoryRoutes;

