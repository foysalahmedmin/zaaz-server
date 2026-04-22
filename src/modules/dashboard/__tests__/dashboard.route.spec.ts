import request from 'supertest';
import app from '../../../app';
import * as DashboardService from '../dashboard.service';
import httpStatus from 'http-status';

jest.mock('../dashboard.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Dashboard Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/dashboard/statistics', () => {
    it('should return 200 and dashboard statistics', async () => {
      const mock = {
        total_revenue: { USD: 1000, BDT: 5000, total_usd_equivalent: 1045 },
        total_users: 50,
        total_transactions: 20,
        total_credits: 5000,
        trends: {
          revenue: { type: 'up', percentage: 10 },
          users: { type: 'neutral', percentage: 0 },
          transactions: { type: 'up', percentage: 5 },
          credits: { type: 'up', percentage: 15 },
        },
      };
      (DashboardService.getDashboardStatistics as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/dashboard/statistics');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock);
    });
  });
});
