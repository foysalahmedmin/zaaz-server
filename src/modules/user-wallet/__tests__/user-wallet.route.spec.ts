import request from 'supertest';
import app from '../../../app';
import * as UserWalletService from '../user-wallet.service';
import httpStatus from 'http-status';

jest.mock('../user-wallet.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('UserWallet Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

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

  describe('GET /api/user-wallets/self', () => {
    it('should return 200 and self wallet', async () => {
      const mock = { _id: 'wallet-1', credits: 50 };
      (UserWalletService.getSelfUserWallet as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/user-wallets/self');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
    });
  });
});
