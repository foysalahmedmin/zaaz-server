import request from 'supertest';
import app from '../../../app';
import * as NotificationRecipientService from '../notification-recipient.service';
import httpStatus from 'http-status';

jest.mock('../notification-recipient.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('NotificationRecipient Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/notification-recipients', () => {
    it('should return 200 and a list of recipients', async () => {
      const mock = {
        data: [{ _id: 'nr-1', is_read: false }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (NotificationRecipientService.getNotificationRecipients as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/notification-recipients');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
