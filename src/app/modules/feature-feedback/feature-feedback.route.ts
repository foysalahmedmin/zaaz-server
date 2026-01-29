import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FeatureFeedbackController from './feature-feedback.controller';
import { FeatureFeedbackValidation } from './feature-feedback.validation';

const router = express.Router();

router.post(
  '/',
  auth('user', 'admin', 'super-admin'),
  validation(FeatureFeedbackValidation.createFeatureFeedbackValidationSchema),
  FeatureFeedbackController.createFeatureFeedback,
);

router.get(
  '/',
  auth('admin', 'super-admin'),
  FeatureFeedbackController.getFeatureFeedbacks,
);

router.patch(
  '/:id',
  auth('admin', 'super-admin'),
  validation(FeatureFeedbackValidation.updateFeatureFeedbackValidationSchema),
  FeatureFeedbackController.updateFeatureFeedback,
);

router.delete(
  '/bulk',
  auth('admin', 'super-admin'),
  validation(FeatureFeedbackValidation.bulkOperationValidationSchema),
  FeatureFeedbackController.deleteFeatureFeedbacks,
);

router.patch(
  '/bulk/status',
  auth('admin', 'super-admin'),
  validation(FeatureFeedbackValidation.bulkUpdateStatusValidationSchema),
  FeatureFeedbackController.updateFeatureFeedbacksStatus,
);

router.delete(
  '/:id',
  auth('admin', 'super-admin'),
  FeatureFeedbackController.deleteFeatureFeedback,
);

export const FeatureFeedbackRoutes = router;
