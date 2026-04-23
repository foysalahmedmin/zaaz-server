import request from 'supertest';
import app from '../../../app';
import * as PaymentTransactionService from '../payment-transaction.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../payment-transaction.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

const VALID_ID = '507f1f77bcf86cd799439011';

describe('PaymentTransaction Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('GET /api/payment-transactions/self', () => {
    it('should return 200 and user transactions', async () => {
      const mock_result = {
        data: [{ _id: 'tx-1', amount: 100 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (PaymentTransactionService.getPaymentTransactions as jest.Mock).mockResolvedValue(mock_result);

      const res = await request(app).get('/api/payment-transactions/self');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock_result.data);
    });
  });

  // ------------------------------------------------------------------ //
  describe('GET /api/payment-transactions/:id', () => {
    it('should return 200 and the transaction', async () => {
      const mock_tx = { _id: VALID_ID, status: 'success', amount: 100 };
      (PaymentTransactionService.getPaymentTransaction as jest.Mock).mockResolvedValue(mock_tx);

      const res = await request(app).get(`/api/payment-transactions/${VALID_ID}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(mock_tx);
    });

    it('should return 404 when transaction not found', async () => {
      (PaymentTransactionService.getPaymentTransaction as jest.Mock).mockRejectedValue(
        new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found'),
      );

      const res = await request(app).get(`/api/payment-transactions/${VALID_ID}`);

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  // ------------------------------------------------------------------ //
  describe('GET /api/payment-transactions/:id/status', () => {
    it('should return 200 and transaction status', async () => {
      const mock_status = { status: 'pending', amount: 100, currency: 'USD' };
      (PaymentTransactionService.getPaymentTransactionStatus as jest.Mock).mockResolvedValue(mock_status);

      const res = await request(app).get(`/api/payment-transactions/${VALID_ID}/status`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(mock_status);
    });
  });

  // ------------------------------------------------------------------ //
  describe('DELETE /api/payment-transactions/:id', () => {
    it('should return 200 on soft delete', async () => {
      (PaymentTransactionService.deletePaymentTransaction as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).delete(`/api/payment-transactions/${VALID_ID}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
    });
  });
});
