import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as BillingSettingControllers from './billing-setting.controller';
import * as BillingSettingValidations from './billing-setting.validation';

const router = express.Router();

router.post(
  '/',
  auth('admin'),
  validation(BillingSettingValidations.createBillingSettingValidationSchema),
  BillingSettingControllers.createBillingSetting,
);

router.get('/', auth('admin'), BillingSettingControllers.getAllBillingSettings);

router.get(
  '/:id',
  auth('admin'),
  validation(BillingSettingValidations.billingSettingOperationValidationSchema),
  BillingSettingControllers.getBillingSetting,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(BillingSettingValidations.updateBillingSettingValidationSchema),
  BillingSettingControllers.updateBillingSetting,
);

router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    BillingSettingValidations.billingSettingsOperationValidationSchema,
  ),
  BillingSettingControllers.deleteBillingSettingsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    BillingSettingValidations.billingSettingsOperationValidationSchema,
  ),
  BillingSettingControllers.deleteBillingSettings,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(BillingSettingValidations.billingSettingOperationValidationSchema),
  BillingSettingControllers.deleteBillingSettingPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(BillingSettingValidations.billingSettingOperationValidationSchema),
  BillingSettingControllers.deleteBillingSetting,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    BillingSettingValidations.billingSettingsOperationValidationSchema,
  ),
  BillingSettingControllers.restoreBillingSettings,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(BillingSettingValidations.billingSettingOperationValidationSchema),
  BillingSettingControllers.restoreBillingSetting,
);

export const BillingSettingRoutes = router;
