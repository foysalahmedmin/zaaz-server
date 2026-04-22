import request from 'supertest';
import app from '../../../app';
import * as PaymentTransactionService from '../payment-transaction.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../payment-transaction.service');

jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'user' };
    next();
  };
});

const VALID_ID = '507f1f77bcf86cd799439011';

describe('PaymentTransaction Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('GET /api/payment-transactions/self', () => {
    it('should return 200 and user transactions', async () => {
      const mockResult = {
        data: [{ _id: 'tx-1', amount: 100 }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (PaymentTransactionService.getPaymentTransactions as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).get('/api/payment-transactions/self');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult.data);
    });
  });

  // ------------------------------------------------------------------ //
  describe('GET /api/payment-transactions/:id', () => {
    it('should return 200 and the transaction', async () => {
      const mockTx = { _id: VALID_ID, status: 'success', amount: 100 };
      (PaymentTransactionService.getPaymentTransaction as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app).get(`/api/payment-transactions/${VALID_ID}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(mockTx);
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
  describe('POST /api/payment-transactions/initiate', () => {
    const validPayload = {
      package: VALID_ID,
      interval: VALID_ID,
      payment_method: VALID_ID,
      return_url: 'http://return.com',
      cancel_url: 'http://cancel.com',
      currency: 'USD',
    };

    it('should initiate a payment and return redirect URL', async () => {
      const mockResult = {
        payment_transaction: { _id: 'tx-123' },
        redirect_url: 'http://gateway.com',
      };
      (PaymentTransactionService.initiatePayment as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/payment-transactions/initiate')
        .send(validPayload);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.redirect_url).toBe(mockResult.redirect_url);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/payment-transactions/initiate')
        .send({ currency: 'USD' });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if currency is invalid', async () => {
      const res = await request(app)
        .post('/api/payment-transactions/initiate')
        .send({ ...validPayload, currency: 'EUR' });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if return_url is not a valid URL', async () => {
      const res = await request(app)
        .post('/api/payment-transactions/initiate')
        .send({ ...validPayload, return_url: 'not-a-url' });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });

  // ------------------------------------------------------------------ //
  describe('GET /api/payment-transactions/:id/status', () => {
    it('should return 200 and transaction status', async () => {
      const mockStatus = { status: 'pending', amount: 100, currency: 'USD' };
      (PaymentTransactionService.getPaymentTransactionStatus as jest.Mock).mockResolvedValue(mockStatus);

      const res = await request(app).get(`/api/payment-transactions/${VALID_ID}/status`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data).toEqual(mockStatus);
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
