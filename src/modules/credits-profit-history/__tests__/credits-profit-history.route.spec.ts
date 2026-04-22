import request from 'supertest';
import app from '../../../app';
import * as CreditsProfitHistoryService from '../credits-profit-history.service';
import httpStatus from 'http-status';

jest.mock('../credits-profit-history.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('CreditsProfitHistory Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/credits-profit-histories/:creditsProfitId', () => {
    it('should return 200 and a list of histories', async () => {
      const mock = {
        data: [{ _id: 'hist-1', credits_profit: '507f1f77bcf86cd799439011' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (CreditsProfitHistoryService.getCreditsProfitHistories as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/credits-profit-histories/credits-profit/507f1f77bcf86cd799439011');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
