import httpStatus from 'http-status';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { PackagePlan } from '../package-plan/package-plan.model';
import { Coupon } from './coupon.model';
import { TCoupon } from './coupon.type';

const createCoupon = async (payload: TCoupon) => {
  const result = await Coupon.create(payload);
  return result;
};

const getAllCoupons = async (query: Record<string, unknown>) => {
  const couponQuery = new AppAggregationQuery<TCoupon>(Coupon, query)
    .search(['code'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await couponQuery.execute([
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
  const totalUsageResult = await Coupon.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$usage_count' } } },
  ]);

  if (result.meta && result.meta.statistics) {
    result.meta.statistics.total_usage = totalUsageResult[0]?.total || 0;
  }

  return result;
};

const getCouponById = async (id: string) => {
  const result = await Coupon.findById(id);
  return result;
};

const updateCoupon = async (id: string, payload: Partial<TCoupon>) => {
  const result = await Coupon.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteCoupon = async (id: string) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found');
  }
  return await coupon.softDelete();
};

const validateCoupon = async (
  code: string,
  packageId: string,
  planId: string,
  currency: 'USD' | 'BDT',
) => {
  const coupon = await Coupon.findOne({ code, is_active: true });

  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Invalid or inactive coupon code');
  }

  const now = new Date();
  if (now < coupon.valid_from || now > coupon.valid_until) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Coupon has expired or is not yet valid',
    );
  }

  if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
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
  const packagePlan = await PackagePlan.findOne({
    package: packageId,
    plan: planId,
    is_active: true,
  });

  if (!packagePlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package plan not found');
  }

  const originalPrice = packagePlan.price[currency];
  const minPurchase = coupon.min_purchase_amount[currency];

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
    const maxDiscount = coupon.max_discount_amount[currency];
    if (maxDiscount > 0 && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }
  } else {
    discountAmount = coupon.fixed_amount[currency];
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
  deleteCoupon,
  validateCoupon,
};
