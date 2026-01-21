import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CouponServices } from './coupon.service';

const createCoupon = catchAsync(async (req, res) => {
  const result = await CouponServices.createCoupon(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon created successfully',
    data: result,
  });
});

const getAllCoupons = catchAsync(async (req, res) => {
  const result = await CouponServices.getAllCoupons(req.query);
  sendResponse(res, {
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
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon retrieved successfully',
    data: result,
  });
});

const updateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CouponServices.updateCoupon(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon updated successfully',
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CouponServices.deleteCoupon(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Coupon deleted successfully',
    data: null,
  });
});

const validateCoupon = catchAsync(async (req, res) => {
  const { code, package: packageId, plan: planId, currency } = req.body;
  const result = await CouponServices.validateCoupon(
    code,
    packageId,
    planId,
    currency,
  );
  sendResponse(res, {
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
