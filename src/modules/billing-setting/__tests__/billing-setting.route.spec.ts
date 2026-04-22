import request from 'supertest';
import app from '../../../app';
import * as BillingSettingService from '../billing-setting.service';
import httpStatus from 'http-status';

jest.mock('../billing-setting.service');

jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('BillingSetting Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/billing-settings', () => {
    it('should return 200 and a list of billing settings', async () => {
      const mock = {
        data: [{ _id: 'setting-1', credit_price: 0.01 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (BillingSettingService.getAllBillingSettings as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/billing-settings');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
