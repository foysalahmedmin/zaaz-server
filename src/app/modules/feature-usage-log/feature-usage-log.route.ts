import express from 'express';
import auth from '../../middlewares/auth.middleware';
import serverAuth from '../../middlewares/server-auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FeatureUsageLogController from './feature-usage-log.controller';
import {
  createFeatureUsageLogValidationSchema,
  featureUsageLogOperationValidationSchema,
  featureUsageLogsOperationValidationSchema,
} from './feature-usage-log.validation';

const router = express.Router();

// GET (Admin)
router.get('/', auth('admin'), FeatureUsageLogController.getFeatureUsageLogs);

router.get(
  '/:id',
  auth('admin'),
  validation(featureUsageLogOperationValidationSchema),
  FeatureUsageLogController.getFeatureUsageLogById,
);

// DELETE (Admin)
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(featureUsageLogsOperationValidationSchema),
  FeatureUsageLogController.deleteFeatureUsageLogsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(featureUsageLogsOperationValidationSchema),
  FeatureUsageLogController.deleteFeatureUsageLogs,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(featureUsageLogOperationValidationSchema),
  FeatureUsageLogController.deleteFeatureUsageLogPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(featureUsageLogOperationValidationSchema),
  FeatureUsageLogController.deleteFeatureUsageLog,
);

// POST (Server-to-Server)
router.post(
  '/',
  serverAuth(),
  validation(createFeatureUsageLogValidationSchema),
  FeatureUsageLogController.createFeatureUsageLog,
);

export default router;
