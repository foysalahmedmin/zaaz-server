import request from 'supertest';
import app from '../../../app';
import * as UserService from '../user.service';
import httpStatus from 'http-status';

// Mocking the UserService
jest.mock('../user.service');

// Mocking the auth middleware to bypass authentication
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('User Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/self', () => {
    it('should return 200 and the user data', async () => {
      const mockUser = { _id: 'test-user-id', name: 'Test User' };
      (UserService.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/users/self');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser);
    });

    it('should return 404 if user not found', async () => {
      const AppError = require('../../../builder/app-error').default;
      (UserService.getUser as jest.Mock).mockRejectedValue(new AppError(httpStatus.NOT_FOUND, 'User not found'));

      const response = await request(app).get('/api/users/self');

      expect(response.status).toBe(httpStatus.NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });
});
