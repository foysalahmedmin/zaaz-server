import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FeatureEndpointControllers from './feature-endpoint.controller';
import * as FeatureEndpointValidations from './feature-endpoint.validation';

const router = express.Router();

// GET
router.get('/public', FeatureEndpointControllers.getPublicFeatureEndpoints);
router.get('/', auth('admin'), FeatureEndpointControllers.getFeatureEndpoints);

router.get(
  '/:value/public',
  validation(
    FeatureEndpointValidations.getFeatureEndpointByValueValidationSchema,
  ),
  FeatureEndpointControllers.getPublicFeatureEndpointByValue,
);
router.get('/:id/public', FeatureEndpointControllers.getPublicFeatureEndpoint);
router.get(
  '/:id',
  auth('admin'),
  validation(
    FeatureEndpointValidations.featureEndpointOperationValidationSchema,
  ),
  FeatureEndpointControllers.getFeatureEndpoint,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(FeatureEndpointValidations.updateFeatureEndpointsValidationSchema),
  FeatureEndpointControllers.updateFeatureEndpoints,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(FeatureEndpointValidations.updateFeatureEndpointValidationSchema),
  FeatureEndpointControllers.updateFeatureEndpoint,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    FeatureEndpointValidations.featureEndpointsOperationValidationSchema,
  ),
  FeatureEndpointControllers.deleteFeatureEndpointsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    FeatureEndpointValidations.featureEndpointsOperationValidationSchema,
  ),
  FeatureEndpointControllers.deleteFeatureEndpoints,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    FeatureEndpointValidations.featureEndpointOperationValidationSchema,
  ),
  FeatureEndpointControllers.deleteFeatureEndpointPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    FeatureEndpointValidations.featureEndpointOperationValidationSchema,
  ),
  FeatureEndpointControllers.deleteFeatureEndpoint,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(FeatureEndpointValidations.createFeatureEndpointValidationSchema),
  FeatureEndpointControllers.createFeatureEndpoint,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    FeatureEndpointValidations.featureEndpointsOperationValidationSchema,
  ),
  FeatureEndpointControllers.restoreFeatureEndpoints,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    FeatureEndpointValidations.featureEndpointOperationValidationSchema,
  ),
  FeatureEndpointControllers.restoreFeatureEndpoint,
);

const FeatureEndpointRoutes = router;

export default FeatureEndpointRoutes;

