import request from 'supertest';
import app from '../../../app';
import * as PackageHistoryService from '../package-history.service';
import httpStatus from 'http-status';

jest.mock('../package-history.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('PackageHistory Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/package-histories/:packageId', () => {
    it('should return 200 and a list of histories', async () => {
      const mock = {
        data: [{ _id: 'hist-1', package: '507f1f77bcf86cd799439011' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (PackageHistoryService.getPackageHistories as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/package-histories/package/507f1f77bcf86cd799439011');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
