import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import { CouponControllers } from './coupon.controller';
import {
  createCouponValidationSchema,
  updateCouponValidationSchema,
  validateCouponValidationSchema,
} from './coupon.validation';

const router = express.Router();

router.get('/', auth('admin'), CouponControllers.getAllCoupons);
router.get('/:id', auth('admin'), CouponControllers.getCouponById);

router.post(
  '/',
  auth('admin'),
  validation(createCouponValidationSchema),
  CouponControllers.createCoupon,
);

router.post(
  '/validate',
  auth('user', 'admin'),
  validation(validateCouponValidationSchema),
  CouponControllers.validateCoupon,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(updateCouponValidationSchema),
  CouponControllers.updateCoupon,
);

router.delete('/:id', auth('admin'), CouponControllers.deleteCoupon);

const CouponRoutes = router;
export default CouponRoutes;
