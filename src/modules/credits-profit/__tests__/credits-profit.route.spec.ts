import request from 'supertest';
import app from '../../../app';
import * as CreditsProfitService from '../credits-profit.service';
import httpStatus from 'http-status';

jest.mock('../credits-profit.service');

jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('CreditsProfit Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/credits-profits', () => {
    it('should return 200 and a list of credits profits', async () => {
      const mock = {
        data: [{ _id: 'profit-1', name: 'Base', percentage: 10 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (CreditsProfitService.getCreditsProfits as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/credits-profits');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });

  describe('GET /api/credits-profits/:id', () => {
    it('should return 200 with a single profit', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const mock = { _id: validId, name: 'Base', percentage: 10 };
      (CreditsProfitService.getCreditsProfit as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get(`/api/credits-profits/${validId}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(mock);
    });
  });
});
