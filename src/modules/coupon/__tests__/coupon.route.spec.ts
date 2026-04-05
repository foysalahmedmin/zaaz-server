import request from 'supertest';
import app from '../../../app';
import { CouponServices } from '../coupon.service';
import httpStatus from 'http-status';

jest.mock('../coupon.service', () => ({
  CouponServices: {
    getAllCoupons: jest.fn(),
  },
}));

// Mocking the auth middleware
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Coupon Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/coupons', () => {
    it('should return 200 and a list of coupons', async () => {
      const mockResult = {
        data: [{ _id: 'coupon-1', code: 'WINTER2025' }],
        meta: { total: 1, page: 1, limit: 10 }
      };
      (CouponServices.getAllCoupons as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/coupons');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
      expect(CouponServices.getAllCoupons).toHaveBeenCalled();
    });
  });
});
