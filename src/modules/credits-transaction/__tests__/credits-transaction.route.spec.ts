import request from 'supertest';
import app from '../../../app';
import * as CreditsTransactionService from '../credits-transaction.service';
import httpStatus from 'http-status';

jest.mock('../credits-transaction.service');

jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('CreditsTransaction Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/credits-transactions', () => {
    it('should return 200 and a list of transactions', async () => {
      const mock = {
        data: [{ _id: 'txn-1', credits: 50, type: 'increase' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (CreditsTransactionService.getCreditsTransactions as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/credits-transactions');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
