import request from 'supertest';
import app from '../../../app';
import * as PaymentTransactionService from '../payment-transaction.service';
import httpStatus from 'http-status';

jest.mock('../payment-transaction.service');

// Mocking the auth middleware
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'user' };
    next();
  };
});

describe('PaymentTransaction Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/payment-transactions/self', () => {
    it('should return 200 and user transactions', async () => {
      const mockResult = {
        data: [{ _id: 'tx-1', amount: 100 }],
        meta: { total: 1, page: 1, limit: 10 }
      };
      (PaymentTransactionService.getPaymentTransactions as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/payment-transactions/self');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
    });
  });

  describe('POST /api/payment-transactions/initiate', () => {
    it('should initiate a payment and return redirect URL', async () => {
      const mockPayload = {
        package: '507f1f77bcf86cd799439011',
        plan: '507f1f77bcf86cd799439012',
        payment_method: '507f1f77bcf86cd799439013',
        return_url: 'http://return.com',
        cancel_url: 'http://cancel.com',
        currency: 'USD'
      };
      const mockResult = {
        payment_transaction: { _id: 'tx-123' },
        redirect_url: 'http://gateway.com'
      };
      (PaymentTransactionService.initiatePayment as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/payment-transactions/initiate')
        .send(mockPayload);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data.redirect_url).toBe(mockResult.redirect_url);
    });
  });
});
