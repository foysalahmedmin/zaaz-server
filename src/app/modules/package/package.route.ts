import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PackageControllers from './package.controller';
import * as PackageValidations from './package.validation';

const router = express.Router();

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
