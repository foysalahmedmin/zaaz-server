import request from 'supertest';
import app from '../../../app';
import * as FeaturePopupService from '../feature-popup.service';
import httpStatus from 'http-status';

jest.mock('../feature-popup.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('FeaturePopup Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/feature-popups', () => {
    it('should return 200 and a list of feature popups', async () => {
      const mock = {
        data: [{ _id: 'popup-1', name: 'Intro', value: 'intro' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (FeaturePopupService.getFeaturePopups as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/feature-popups');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
