import request from 'supertest';
import app from '../../../app';
import * as IntervalService from '../interval.service';
import httpStatus from 'http-status';

jest.mock('../interval.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Interval Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/intervals', () => {
    it('should return 200 and a list of intervals', async () => {
      const mockResult = {
        data: [{ _id: 'interval-1', name: 'Monthly' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (IntervalService.getIntervals as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/intervals');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
      expect(IntervalService.getIntervals).toHaveBeenCalled();
    });
  });
});
