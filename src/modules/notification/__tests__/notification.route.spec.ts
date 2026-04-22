import request from 'supertest';
import app from '../../../app';
import * as NotificationService from '../notification.service';
import httpStatus from 'http-status';

jest.mock('../notification.service');

jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Notification Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return 200 and a list of notifications', async () => {
      const mock = {
        data: [{ _id: 'notif-1', title: 'Test' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (NotificationService.getNotifications as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
