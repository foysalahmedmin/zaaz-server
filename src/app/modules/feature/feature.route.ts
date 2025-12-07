import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FeatureControllers from './feature.controller';
import * as FeatureValidations from './feature.validation';

const router = express.Router();

// GET
router.get('/public', FeatureControllers.getPublicFeatures);
router.get('/', auth('admin'), FeatureControllers.getFeatures);

router.get(
  '/:value/public',
  validation(FeatureValidations.getFeatureByValueValidationSchema),
  FeatureControllers.getPublicFeatureByValue,
);
router.get('/:id/public', FeatureControllers.getPublicFeature);
router.get(
  '/:id',
  auth('admin'),
  validation(FeatureValidations.featureOperationValidationSchema),
  FeatureControllers.getFeature,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(FeatureValidations.updateFeaturesValidationSchema),
  FeatureControllers.updateFeatures,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(FeatureValidations.updateFeatureValidationSchema),
  FeatureControllers.updateFeature,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(FeatureValidations.featuresOperationValidationSchema),
  FeatureControllers.deleteFeaturesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(FeatureValidations.featuresOperationValidationSchema),
  FeatureControllers.deleteFeatures,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(FeatureValidations.featureOperationValidationSchema),
  FeatureControllers.deleteFeaturePermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(FeatureValidations.featureOperationValidationSchema),
  FeatureControllers.deleteFeature,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(FeatureValidations.createFeatureValidationSchema),
  FeatureControllers.createFeature,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(FeatureValidations.featuresOperationValidationSchema),
  FeatureControllers.restoreFeatures,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(FeatureValidations.featureOperationValidationSchema),
  FeatureControllers.restoreFeature,
);

const FeatureRoutes = router;

export default FeatureRoutes;

