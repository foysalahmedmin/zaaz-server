import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PackagePlanControllers from './package-plan.controller';
import * as PackagePlanValidations from './package-plan.validation';

const router = express.Router();

// GET
router.get('/', auth('admin'), PackagePlanControllers.getPackagePlans);

router.get(
  '/:id',
  auth('admin'),
  validation(PackagePlanValidations.packagePlanOperationValidationSchema),
  PackagePlanControllers.getPackagePlan,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(PackagePlanValidations.createPackagePlanValidationSchema),
  PackagePlanControllers.createPackagePlan,
);

router.post(
  '/bulk',
  auth('admin'),
  validation(PackagePlanValidations.createPackagePlansValidationSchema),
  PackagePlanControllers.createPackagePlans,
);

// PATCH
router.patch(
  '/:id',
  auth('admin'),
  validation(PackagePlanValidations.updatePackagePlanValidationSchema),
  PackagePlanControllers.updatePackagePlan,
);

// DELETE
router.delete(
  '/:id',
  auth('admin'),
  validation(PackagePlanValidations.packagePlanOperationValidationSchema),
  PackagePlanControllers.deletePackagePlan,
);

const PackagePlanRoutes = router;

export default PackagePlanRoutes;

