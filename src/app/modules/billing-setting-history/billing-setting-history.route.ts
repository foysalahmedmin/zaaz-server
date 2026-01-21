import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as BillingSettingHistoryControllers from './billing-setting-history.controller';
import * as BillingSettingHistoryValidations from './billing-setting-history.validation';

const router = express.Router();

// GET
router.get(
  '/billing-setting/:billingSettingId',
  auth('admin'),
  BillingSettingHistoryControllers.getBillingSettingHistories,
);

router.get(
  '/:id',
  auth('admin'),
  validation(
    BillingSettingHistoryValidations.billingSettingHistoryOperationValidationSchema,
  ),
  BillingSettingHistoryControllers.getBillingSettingHistory,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    BillingSettingHistoryValidations.billingSettingHistoriesOperationValidationSchema,
  ),
  BillingSettingHistoryControllers.deleteBillingSettingHistoriesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    BillingSettingHistoryValidations.billingSettingHistoriesOperationValidationSchema,
  ),
  BillingSettingHistoryControllers.deleteBillingSettingHistories,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    BillingSettingHistoryValidations.billingSettingHistoryOperationValidationSchema,
  ),
  BillingSettingHistoryControllers.deleteBillingSettingHistoryPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    BillingSettingHistoryValidations.billingSettingHistoryOperationValidationSchema,
  ),
  BillingSettingHistoryControllers.deleteBillingSettingHistory,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    BillingSettingHistoryValidations.billingSettingHistoriesOperationValidationSchema,
  ),
  BillingSettingHistoryControllers.restoreBillingSettingHistories,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    BillingSettingHistoryValidations.billingSettingHistoryOperationValidationSchema,
  ),
  BillingSettingHistoryControllers.restoreBillingSettingHistory,
);

export const BillingSettingHistoryRoutes = router;
