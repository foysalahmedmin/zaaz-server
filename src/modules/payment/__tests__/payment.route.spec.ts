import request from 'supertest';
import app from '../../../app';
import * as PaymentService from '../payment.service';
import * as ReconciliationService from '../payment-reconciliation.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../payment.service');
jest.mock('../payment-reconciliation.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'user' };
    next();
  };
});

const VALID_ID = '507f1f77bcf86cd799439011';

describe('Payment Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('POST /api/payments/initiate', () => {
    const valid_payload = {
      package: VALID_ID,
      interval: VALID_ID,
      payment_method: VALID_ID,
      return_url: 'http://return.com',
      cancel_url: 'http://cancel.com',
      currency: 'USD',
    };

    it('should initiate a payment and return redirect URL', async () => {
      const mock_result = {
        payment_transaction: { _id: 'tx-123' },
        redirect_url: 'http://gateway.com',
      };
      (PaymentService.initiatePayment as jest.Mock).mockResolvedValue(mock_result);

      const res = await request(app)
        .post('/api/payments/initiate')
        .send(valid_payload);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.redirect_url).toBe(mock_result.redirect_url);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .send({ currency: 'USD' });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if currency is invalid', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .send({ ...valid_payload, currency: 'EUR' });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if return_url is not a valid URL', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .send({ ...valid_payload, return_url: 'not-a-url' });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });

  // ------------------------------------------------------------------ //
  describe('POST /api/payments/:id/verify', () => {
    it('should return 200 and verification result', async () => {
      const mock_result = { verified: true, status: 'success', transaction: { _id: VALID_ID } };
      (PaymentService.verifyPayment as jest.Mock).mockResolvedValue(mock_result);

      const res = await request(app).post(`/api/payments/${VALID_ID}/verify`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verified).toBe(true);
    });

    it('should return 404 when transaction not found', async () => {
      (PaymentService.verifyPayment as jest.Mock).mockRejectedValue(
        new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found'),
      );

      const res = await request(app).post(`/api/payments/${VALID_ID}/verify`);

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  // ------------------------------------------------------------------ //
  describe('POST /api/payments/reconcile', () => {
    it('should return 200 with reconciliation stats', async () => {
      const mock_stats = { total: 5, success: 3, failed: 1, error: 0, skipped: 1 };
      (ReconciliationService.reconcilePendingTransactions as jest.Mock).mockResolvedValue(mock_stats);

      const res = await request(app).post('/api/payments/reconcile');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock_stats);
    });
  });
});
