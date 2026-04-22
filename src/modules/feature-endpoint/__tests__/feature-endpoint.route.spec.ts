import request from 'supertest';
import app from '../../../app';
import * as FeatureEndpointService from '../feature-endpoint.service';
import httpStatus from 'http-status';

jest.mock('../feature-endpoint.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('FeatureEndpoint Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/feature-endpoints', () => {
    it('should return 200 and a list of feature endpoints', async () => {
      const mock = {
        data: [{ _id: 'ep-1', name: 'Generate', value: 'generate' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (FeatureEndpointService.getFeatureEndpoints as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/feature-endpoints');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
