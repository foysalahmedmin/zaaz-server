import request from 'supertest';
import app from '../../../app';
import * as UserWalletService from '../user-wallet.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../user-wallet.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

const VALID_ID = '507f1f77bcf86cd799439011';

describe('UserWallet Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('GET /api/user-wallets', () => {
    it('should return 200 and a list of wallets', async () => {
      const mock = {
        data: [{ _id: 'wallet-1', credits: 100 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (UserWalletService.getUserWallets as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/user-wallets');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });

  // ------------------------------------------------------------------ //
  describe('GET /api/user-wallets/self', () => {
    it('should return 200 and self wallet', async () => {
      const mock = { _id: 'wallet-1', credits: 50 };
      (UserWalletService.getSelfUserWallet as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/user-wallets/self');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
    });
  });

  // ------------------------------------------------------------------ //
  describe('GET /api/user-wallets/:id', () => {
    it('should return 200 and the wallet', async () => {
      const mock = { _id: VALID_ID, credits: 200 };
      (UserWalletService.getUserWalletById as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get(`/api/user-wallets/${VALID_ID}`);
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(mock);
    });

    it('should return 404 when wallet not found', async () => {
      (UserWalletService.getUserWalletById as jest.Mock).mockRejectedValue(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found'),
      );

      const res = await request(app).get(`/api/user-wallets/${VALID_ID}`);
      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  // ------------------------------------------------------------------ //
  describe('POST /api/user-wallets/assign-package', () => {
    const validPayload = {
      user_id: VALID_ID,
      package_id: VALID_ID,
      interval_id: VALID_ID,
      increase_source: 'bonus',
    };

    it('should return 200 on successful package assignment', async () => {
      const mock = { _id: 'wallet-1', credits: 500 };
      (UserWalletService.assignPackage as jest.Mock).mockResolvedValue(mock);

      const res = await request(app)
        .post('/api/user-wallets/assign-package')
        .send(validPayload);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/user-wallets/assign-package')
        .send({ user_id: VALID_ID });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if increase_source is invalid', async () => {
      const res = await request(app)
        .post('/api/user-wallets/assign-package')
        .send({ ...validPayload, increase_source: 'invalid' });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });

  // ------------------------------------------------------------------ //
  describe('DELETE /api/user-wallets/:id', () => {
    it('should return 200 on soft delete', async () => {
      (UserWalletService.deleteUserWallet as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).delete(`/api/user-wallets/${VALID_ID}`);
      expect(res.status).toBe(httpStatus.OK);
    });

    it('should return 404 when wallet not found', async () => {
      (UserWalletService.deleteUserWallet as jest.Mock).mockRejectedValue(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found'),
      );

      const res = await request(app).delete(`/api/user-wallets/${VALID_ID}`);
      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});
