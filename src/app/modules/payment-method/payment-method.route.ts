import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PaymentMethodControllers from './payment-method.controller';
import * as PaymentMethodValidations from './payment-method.validation';

const router = express.Router();

// GET
router.get('/public', PaymentMethodControllers.getPublicPaymentMethods);
router.get('/', auth('admin'), PaymentMethodControllers.getPaymentMethods);

router.get('/:id/public', PaymentMethodControllers.getPublicPaymentMethod);
router.get(
  '/:id',
  auth('admin'),
  validation(PaymentMethodValidations.paymentMethodOperationValidationSchema),
  PaymentMethodControllers.getPaymentMethod,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(PaymentMethodValidations.updatePaymentMethodsValidationSchema),
  PaymentMethodControllers.updatePaymentMethods,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(PaymentMethodValidations.updatePaymentMethodValidationSchema),
  PaymentMethodControllers.updatePaymentMethod,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(PaymentMethodValidations.paymentMethodsOperationValidationSchema),
  PaymentMethodControllers.deletePaymentMethodsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(PaymentMethodValidations.paymentMethodsOperationValidationSchema),
  PaymentMethodControllers.deletePaymentMethods,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(PaymentMethodValidations.paymentMethodOperationValidationSchema),
  PaymentMethodControllers.deletePaymentMethodPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(PaymentMethodValidations.paymentMethodOperationValidationSchema),
  PaymentMethodControllers.deletePaymentMethod,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(PaymentMethodValidations.createPaymentMethodValidationSchema),
  PaymentMethodControllers.createPaymentMethod,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(PaymentMethodValidations.paymentMethodsOperationValidationSchema),
  PaymentMethodControllers.restorePaymentMethods,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(PaymentMethodValidations.paymentMethodOperationValidationSchema),
  PaymentMethodControllers.restorePaymentMethod,
);

const PaymentMethodRoutes = router;

export default PaymentMethodRoutes;

