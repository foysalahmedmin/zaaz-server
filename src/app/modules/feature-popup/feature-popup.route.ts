import express from 'express';
import auth from '../../middlewares/auth.middleware';
import storage from '../../middlewares/storage.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FeaturePopupControllers from './feature-popup.controller';
import * as FeaturePopupValidations from './feature-popup.validation';

const router = express.Router();

// File upload configuration
const imageConfig = {
  name: 'image',
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  size: 5_000_000, // 5MB
  maxCount: 1,
  makePublic: true,
};

const videoConfig = {
  name: 'video',
  allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  size: 50_000_000, // 50MB
  maxCount: 1,
  makePublic: true,
};

// GET
router.get('/public', FeaturePopupControllers.getPublicFeaturePopups);
router.get('/', auth('admin'), FeaturePopupControllers.getFeaturePopups);

router.get(
  '/:id',
  auth('admin'),
  validation(FeaturePopupValidations.featurePopupOperationValidationSchema),
  FeaturePopupControllers.getFeaturePopup,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(FeaturePopupValidations.featurePopupsOperationValidationSchema),
  FeaturePopupControllers.deleteFeaturePopupsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(FeaturePopupValidations.featurePopupsOperationValidationSchema),
  FeaturePopupControllers.deleteFeaturePopups,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(FeaturePopupValidations.featurePopupOperationValidationSchema),
  FeaturePopupControllers.deleteFeaturePopupPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(FeaturePopupValidations.featurePopupOperationValidationSchema),
  FeaturePopupControllers.deleteFeaturePopup,
);

// POST
router.post(
  '/',
  auth('admin'),
  storage(imageConfig, videoConfig),
  validation(FeaturePopupValidations.createFeaturePopupValidationSchema),
  FeaturePopupControllers.createFeaturePopup,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(FeaturePopupValidations.featurePopupsOperationValidationSchema),
  FeaturePopupControllers.restoreFeaturePopups,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(FeaturePopupValidations.featurePopupOperationValidationSchema),
  FeaturePopupControllers.restoreFeaturePopup,
);

// PATCH
router.patch(
  '/:id',
  auth('admin'),
  storage(imageConfig, videoConfig), // Storage middleware first to parse FormData
  validation(FeaturePopupValidations.updateFeaturePopupValidationSchema),
  FeaturePopupControllers.updateFeaturePopup,
);

const FeaturePopupRoutes = router;

export default FeaturePopupRoutes;

