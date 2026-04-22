import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import { CouponServices } from './coupon.service';

const createCoupon = catchAsync(async (req, res) => {
  const result = await CouponServices.createCoupon(req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon created successfully',
    data: result,
  });
});

const getAllCoupons = catchAsync(async (req, res) => {
  const result = await CouponServices.getAllCoupons(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupons retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getCouponById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CouponServices.getCouponById(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon retrieved successfully',
    data: result,
  });
});

const updateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CouponServices.updateCoupon(id, req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon updated successfully',
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CouponServices.deleteCoupon(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon deleted successfully',
    data: null,
  });
});

const validateCoupon = catchAsync(async (req, res) => {
  const { code, package: packageId, interval: intervalId, currency } = req.body;
  const result = await CouponServices.validateCoupon(
    code,
    packageId,
    intervalId,
    currency,
  );
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon is valid',
    data: result,
  });
});

export const CouponControllers = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};


