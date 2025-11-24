import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PlanControllers from './plan.controller';
import * as PlanValidations from './plan.validation';

const router = express.Router();

// GET Public Plans (No Auth Required)
router.get('/public', PlanControllers.getPublicPlans);

// GET
router.get('/', auth('admin'), PlanControllers.getPlans);

router.get(
  '/:id',
  auth('admin'),
  validation(PlanValidations.planOperationValidationSchema),
  PlanControllers.getPlan,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(PlanValidations.updatePlansValidationSchema),
  PlanControllers.updatePlans,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(PlanValidations.updatePlanValidationSchema),
  PlanControllers.updatePlan,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(PlanValidations.plansOperationValidationSchema),
  PlanControllers.deletePlansPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(PlanValidations.plansOperationValidationSchema),
  PlanControllers.deletePlans,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(PlanValidations.planOperationValidationSchema),
  PlanControllers.deletePlanPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(PlanValidations.planOperationValidationSchema),
  PlanControllers.deletePlan,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(PlanValidations.createPlanValidationSchema),
  PlanControllers.createPlan,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(PlanValidations.plansOperationValidationSchema),
  PlanControllers.restorePlans,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(PlanValidations.planOperationValidationSchema),
  PlanControllers.restorePlan,
);

const PlanRoutes = router;

export default PlanRoutes;
