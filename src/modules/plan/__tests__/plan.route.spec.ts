import request from 'supertest';
import app from '../../../app';
import * as PlanService from '../plan.service';
import httpStatus from 'http-status';

jest.mock('../plan.service');

// Mocking the auth middleware
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Plan Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/plans', () => {
    it('should return 200 and a list of plans', async () => {
      const mockResult = {
        data: [{ _id: 'plan-1', name: 'Starter' }],
        meta: { total: 1, page: 1, limit: 10 }
      };
      (PlanService.getPlans as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/plans');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
      expect(PlanService.getPlans).toHaveBeenCalled();
    });
  });
});
