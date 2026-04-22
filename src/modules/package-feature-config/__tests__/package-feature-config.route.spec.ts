import request from 'supertest';
import app from '../../../app';
import * as PackageFeatureConfigService from '../package-feature-config.service';
import httpStatus from 'http-status';

jest.mock('../package-feature-config.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('PackageFeatureConfig Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/package-feature-configs', () => {
    it('should return 200 and a list of configs', async () => {
      const mock = [{ _id: 'cfg-1', config: { max_credits: 100 } }];
      (PackageFeatureConfigService.getPackageFeatureConfigs as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/package-feature-configs');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock);
    });
  });
});
