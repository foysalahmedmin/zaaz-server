import request from 'supertest';
import app from '../../../app';
import * as FeatureUsageLogService from '../feature-usage-log.service';
import httpStatus from 'http-status';

jest.mock('../feature-usage-log.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('FeatureUsageLog Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/feature-usage-logs', () => {
    it('should return 200 and a list of logs', async () => {
      const mock = {
        data: [{ _id: 'log-1', status: 'success' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (FeatureUsageLogService.getFeatureUsageLogs as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/feature-usage-logs');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
