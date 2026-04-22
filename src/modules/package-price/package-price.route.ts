import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PackagePriceControllers from './package-price.controller';
import * as PackagePriceValidations from './package-price.validator';

const router = express.Router();

router.get('/', auth('admin'), PackagePriceControllers.getPackagePrices);

router.get(
  '/:id',
  auth('admin'),
  validation(PackagePriceValidations.packagePriceOperationValidationSchema),
  PackagePriceControllers.getPackagePrice,
);

router.post(
  '/',
  auth('admin'),
  validation(PackagePriceValidations.createPackagePriceValidationSchema),
  PackagePriceControllers.createPackagePrice,
);

router.post(
  '/bulk',
  auth('admin'),
  validation(PackagePriceValidations.createPackagePricesValidationSchema),
  PackagePriceControllers.createPackagePrices,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(PackagePriceValidations.updatePackagePriceValidationSchema),
  PackagePriceControllers.updatePackagePrice,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(PackagePriceValidations.packagePriceOperationValidationSchema),
  PackagePriceControllers.deletePackagePrice,
);

const PackagePriceRoutes = router;

export default PackagePriceRoutes;
