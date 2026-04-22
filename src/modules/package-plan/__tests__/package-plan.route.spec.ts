import request from 'supertest';
import app from '../../../app';
import * as PackagePlanService from '../package-plan.service';
import httpStatus from 'http-status';

jest.mock('../package-plan.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('PackagePlan Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/package-plans', () => {
    it('should return 200 and a list of package plans', async () => {
      const mock = {
        data: [{ _id: 'pp-1', price: 100, credits: 500 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (PackagePlanService.getPackagePlans as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/package-plans');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });

  describe('DELETE /api/package-plans/:id', () => {
    it('should return 200 on successful soft delete', async () => {
      (PackagePlanService.deletePackagePlan as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).delete('/api/package-plans/507f1f77bcf86cd799439011');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
    });
  });
});
