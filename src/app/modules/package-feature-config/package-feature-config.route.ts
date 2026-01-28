import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PackageFeatureConfigControllers from './package-feature-config.controller';
import * as PackageFeatureConfigValidations from './package-feature-config.validation';

const router = express.Router();

// Get all package feature configs (with filters)
router.get(
  '/',
  auth('super-admin', 'admin'),
  PackageFeatureConfigControllers.getPackageFeatureConfigs,
);

// Get single package feature config
router.get(
  '/:id',
  auth('super-admin', 'admin'),
  PackageFeatureConfigControllers.getPackageFeatureConfig,
);

// Create package feature config
router.post(
  '/',
  auth('super-admin', 'admin'),
  validation(
    PackageFeatureConfigValidations.createPackageFeatureConfigValidationSchema,
  ),
  PackageFeatureConfigControllers.createPackageFeatureConfig,
);

// Update package feature config
router.patch(
  '/:id',
  auth('super-admin', 'admin'),
  validation(
    PackageFeatureConfigValidations.updatePackageFeatureConfigValidationSchema,
  ),
  PackageFeatureConfigControllers.updatePackageFeatureConfig,
);

// Soft delete package feature config
router.delete(
  '/:id',
  auth('super-admin', 'admin'),
  PackageFeatureConfigControllers.deletePackageFeatureConfig,
);

// Permanent delete package feature config
router.delete(
  '/:id/permanent',
  auth('super-admin'),
  PackageFeatureConfigControllers.deletePackageFeatureConfigPermanent,
);

export const PackageFeatureConfigRoutes = router;
