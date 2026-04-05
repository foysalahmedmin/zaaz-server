import * as CouponRepository from '../coupon.repository';
import { CouponServices } from '../coupon.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../coupon.repository');

describe('Coupon Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCouponById', () => {
    it('should return the coupon if it exists', async () => {
      const mockResult = { _id: 'coupon-1', code: 'PROMO10' };
      (CouponRepository.findById as jest.Mock).mockResolvedValue(mockResult);

      const result = await CouponServices.getCouponById('coupon-1');

      expect(result).toEqual(mockResult);
      expect(CouponRepository.findById).toHaveBeenCalledWith('coupon-1');
    });
  });

  describe('validateCoupon', () => {
    it('should throw an error if coupon is invalid', async () => {
      (CouponRepository.findActiveByCode as jest.Mock).mockResolvedValue(null);

      await expect(
        CouponServices.validateCoupon('INVALID', 'pkg-1', 'plan-1', 'USD')
      ).rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Invalid or inactive coupon code'));
    });
  });

  describe('deleteCoupon', () => {
    it('should soft delete the coupon and return it', async () => {
      const mockResult = { _id: 'coupon-1', is_deleted: true };
      (CouponRepository.softDelete as jest.Mock).mockResolvedValue(mockResult);

      const result = await CouponServices.deleteCoupon('coupon-1');

      expect(result).toEqual(mockResult);
      expect(CouponRepository.softDelete).toHaveBeenCalledWith('coupon-1');
    });

    it('should throw not found if soft delete fails (null returned)', async () => {
      (CouponRepository.softDelete as jest.Mock).mockResolvedValue(null);

      await expect(CouponServices.deleteCoupon('coupon-1')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Coupon not found')
      );
    });
  });
});
