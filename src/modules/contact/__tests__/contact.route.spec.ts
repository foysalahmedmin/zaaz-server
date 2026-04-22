import request from 'supertest';
import app from '../../../app';
import * as ContactService from '../contact.service';
import httpStatus from 'http-status';

jest.mock('../contact.service');

jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Contact Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/contact', () => {
    it('should return 200 and a list of contacts', async () => {
      const mock = {
        data: [{ _id: 'contact-1', name: 'John', subject: 'Hi' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (ContactService.getContacts as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/contact');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
