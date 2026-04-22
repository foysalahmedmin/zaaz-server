import request from 'supertest';
import app from '../../../app';
import * as FeatureService from '../feature.service';
import httpStatus from 'http-status';

jest.mock('../feature.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Feature Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/features', () => {
    it('should return 200 and a list of features', async () => {
      const mock = {
        data: [{ _id: 'feat-1', name: 'Writing', value: 'writing' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (FeatureService.getFeatures as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/features');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
