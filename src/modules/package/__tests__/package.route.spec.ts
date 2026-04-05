import request from 'supertest';
import app from '../../../app';
import * as PackageService from '../package.service';
import httpStatus from 'http-status';

jest.mock('../package.service');

// Mocking the auth middleware
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('Package Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/packages', () => {
    it('should return 200 and packages list', async () => {
      const mockResult = {
        data: [{ _id: 'pkg-1', name: 'Standard' }],
        meta: { total: 1, page: 1, limit: 10 }
      };
      (PackageService.getPackages as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/packages');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
    });
  });
});
