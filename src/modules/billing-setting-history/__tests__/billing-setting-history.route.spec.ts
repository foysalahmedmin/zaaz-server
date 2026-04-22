import request from 'supertest';
import app from '../../../app';
import * as BillingSettingHistoryService from '../billing-setting-history.service';
import httpStatus from 'http-status';

jest.mock('../billing-setting-history.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('BillingSettingHistory Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/billing-setting-histories/:billingSettingId', () => {
    it('should return 200 and a list of histories', async () => {
      const mock = {
        data: [{ _id: 'hist-1', billing_setting: '507f1f77bcf86cd799439011' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (BillingSettingHistoryService.getBillingSettingHistories as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/billing-setting-histories/billing-setting/507f1f77bcf86cd799439011');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
