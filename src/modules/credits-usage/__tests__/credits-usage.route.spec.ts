import request from 'supertest';
import app from '../../../app';
import * as CreditsUsageService from '../credits-usage.service';
import httpStatus from 'http-status';

jest.mock('../credits-usage.service');

// Mocking the auth middleware
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('CreditsUsage Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/credits-usages', () => {
    it('should return 200 and a list of usage logs', async () => {
      const mockResult = {
        data: [{ _id: 'usage-1', usage_key: 'test' }],
        meta: { total: 1, page: 1, limit: 10 }
      };
      (CreditsUsageService.getCreditsUsages as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/credits-usages');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
      expect(CreditsUsageService.getCreditsUsages).toHaveBeenCalled();
    });
  });
});
