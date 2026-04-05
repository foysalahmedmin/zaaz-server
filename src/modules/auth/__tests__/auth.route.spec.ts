import request from 'supertest';
import app from '../../../app';
import * as AuthServices from '../auth.service';
import httpStatus from 'http-status';

jest.mock('../auth.service');

describe('Auth Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signin', () => {
    it('should return 200 and tokens on successful signin', async () => {
      const mockResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        info: { name: 'Test User', email: 'test@example.com' }
      };
      (AuthServices.signin as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        token: mockResult.access_token,
        info: mockResult.info
      });
    });

    it('should return 400 if validation fails (empty payload)', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({});

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
      expect(response.body.success).toBe(false);
    });
  });
});
