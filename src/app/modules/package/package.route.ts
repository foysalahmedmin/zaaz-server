import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PackageFeatureConfigControllers from '../package-feature-config/package-feature-config.controller';
import * as PackageFeatureConfigValidations from '../package-feature-config/package-feature-config.validation';
import * as PackageControllers from './package.controller';
import * as PackageValidations from './package.validation';

const router = express.Router();

// Package Configs
router.get(
  '/:packageId/configs',
  auth('super-admin', 'admin'),
  PackageFeatureConfigControllers.getPackageConfigs,
);

router.post(
  '/:packageId/configs/bulk',
  auth('super-admin', 'admin'),
  validation(PackageFeatureConfigValidations.bulkUpsertConfigsValidationSchema),
  PackageFeatureConfigControllers.bulkUpsertConfigs,
);

// GET
router.get('/public', PackageControllers.getPublicPackages);
router.get('/', auth('admin'), PackageControllers.getPackages);

router.get('/:id/public', PackageControllers.getPublicPackage);
router.get(
  '/:id',
  auth('admin'),
  validation(PackageValidations.packageOperationValidationSchema),
  PackageControllers.getPackage,
);

router.get(
  '/:id/with-configs',
  auth('admin'),
  validation(PackageValidations.packageOperationValidationSchema),
  PackageControllers.getPackageWithConfigs,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(PackageValidations.updatePackagesValidationSchema),
  PackageControllers.updatePackages,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(PackageValidations.updatePackageValidationSchema),
  PackageControllers.updatePackage,
);

router.patch(
  '/:id/is-initial',
  auth('admin'),
  validation(PackageValidations.updatePackageIsInitialValidationSchema),
  PackageControllers.updatePackageIsInitial,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(PackageValidations.packagesOperationValidationSchema),
  PackageControllers.deletePackagesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(PackageValidations.packagesOperationValidationSchema),
  PackageControllers.deletePackages,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(PackageValidations.packageOperationValidationSchema),
  PackageControllers.deletePackagePermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(PackageValidations.packageOperationValidationSchema),
  PackageControllers.deletePackage,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(PackageValidations.createPackageValidationSchema),
  PackageControllers.createPackage,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(PackageValidations.packagesOperationValidationSchema),
  PackageControllers.restorePackages,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(PackageValidations.packageOperationValidationSchema),
  PackageControllers.restorePackage,
);

const PackageRoutes = router;

export default PackageRoutes;
