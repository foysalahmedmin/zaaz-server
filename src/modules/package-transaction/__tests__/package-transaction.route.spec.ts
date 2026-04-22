import request from 'supertest';
import app from '../../../app';
import * as PackageTransactionService from '../package-transaction.service';
import httpStatus from 'http-status';

jest.mock('../package-transaction.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('PackageTransaction Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/package-transactions', () => {
    it('should return 200 and a list of transactions', async () => {
      const mock = {
        data: [{ _id: 'tx-1', credits: 100 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (PackageTransactionService.getPackageTransactions as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/package-transactions');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
