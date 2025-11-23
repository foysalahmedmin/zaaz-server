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

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    PackageHistoryValidations.packageHistoriesOperationValidationSchema,
  ),
  PackageHistoryControllers.deletePackageHistoriesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    PackageHistoryValidations.packageHistoriesOperationValidationSchema,
  ),
  PackageHistoryControllers.deletePackageHistories,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(PackageHistoryValidations.packageHistoryOperationValidationSchema),
  PackageHistoryControllers.deletePackageHistoryPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(PackageHistoryValidations.packageHistoryOperationValidationSchema),
  PackageHistoryControllers.deletePackageHistory,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    PackageHistoryValidations.packageHistoriesOperationValidationSchema,
  ),
  PackageHistoryControllers.restorePackageHistories,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(PackageHistoryValidations.packageHistoryOperationValidationSchema),
  PackageHistoryControllers.restorePackageHistory,
);

const PackageHistoryRoutes = router;

export default PackageHistoryRoutes;
