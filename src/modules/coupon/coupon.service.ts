import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { getPriceInCurrency } from '../../utils/currency.utils';
import { PackagePrice } from '../package-price/package-price.model';
import * as CouponRepository from './coupon.repository';
import { TCoupon } from './coupon.type';

const createCoupon = async (payload: TCoupon) => {
  return await CouponRepository.create(payload);
};

const getAllCoupons = async (query: Record<string, unknown>) => {
  const result = await CouponRepository.findPaginated(query, [
    {
      key: 'active',
      filter: { is_active: true },
    },
    {
      key: 'inactive',
      filter: { is_active: false },
    },
    {
      key: 'expired',
      filter: { valid_until: { $lt: new Date() } },
    },
  ]);

  // Calculate global total usage
  const totalUsage = await CouponRepository.getTotalUsage();

  if (result.meta && result.meta.statistics) {
    result.meta.statistics.total_usage = totalUsage;
  }

  return result;
};

const getCouponById = async (id: string) => {
  return await CouponRepository.findById(id);
};

const updateCoupon = async (id: string, payload: Partial<TCoupon>) => {
  return await CouponRepository.updateById(id, payload);
};

const deleteCoupon = async (id: string) => {
  const result = await CouponRepository.softDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found');
  }
  return result;
};

const updateCouponByCode = async (
  code: string,
  payload: Partial<TCoupon>,
  options: Record<string, any> = {},
) => {
  return await CouponRepository.updateByCode(code, payload, options);
};

const deleteCouponByCode = async (
  code: string,
  options: Record<string, any> = {},
) => {
  const result = await CouponRepository.softDeleteByCode(code, options);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found');
  }
  return result;
};

const validateCoupon = async (
  code: string,
  packageId: string,
  intervalId: string,
  currency: 'USD' | 'BDT',
) => {
  const coupon = await CouponRepository.findActiveByCode(code);

  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Invalid or inactive coupon code');
  }

  const now = new Date();
  if (
    (coupon.valid_from && now < coupon.valid_from) ||
    (coupon.valid_until && now > coupon.valid_until)
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Coupon has expired or is not yet valid',
    );
  }

  if (
    typeof coupon.usage_limit === 'number' &&
    coupon.usage_limit > 0 &&
    coupon.usage_count >= coupon.usage_limit
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Coupon usage limit reached');
  }

  if (
    coupon.applicable_packages.length > 0 &&
    !coupon.applicable_packages.some((id) => id.toString() === packageId)
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Coupon is not applicable for this package',
    );
  }

  // Get price for min purchase validation
  const packagePrice = await PackagePrice.findOne({
    package: packageId,
    interval: intervalId,
    is_active: true,
  });

  if (!packagePrice) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package price not found');
  }

  const originalPrice = getPriceInCurrency(packagePrice.price, currency);
  const minPurchase = getPriceInCurrency(coupon.min_purchase_amount, currency);

  if (originalPrice < minPurchase) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum purchase amount of ${minPurchase} ${currency} required for this coupon`,
    );
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (originalPrice * coupon.discount_value) / 100;
    const maxDiscount = getPriceInCurrency(
      coupon.max_discount_amount,
      currency,
    );
    if (maxDiscount > 0 && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }
  } else {
    discountAmount = getPriceInCurrency(coupon.fixed_amount, currency);
  }

  // Ensure discount doesn't exceed original price
  if (discountAmount > originalPrice) {
    discountAmount = originalPrice;
  }

  return {
    coupon,
    discount_amount: discountAmount,
    final_amount: originalPrice - discountAmount,
  };
};

export const CouponServices = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  updateCouponByCode,
  deleteCoupon,
  deleteCouponByCode,
  validateCoupon,
  isCouponExist: CouponRepository.isCouponExist,
};




