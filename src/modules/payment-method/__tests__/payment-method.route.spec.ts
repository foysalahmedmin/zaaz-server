import request from 'supertest';
import app from '../../../app';
import * as PaymentMethodService from '../payment-method.service';
import httpStatus from 'http-status';

jest.mock('../payment-method.service');

// Mocking the auth middleware
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-admin-id', role: 'admin' };
    next();
  };
});

describe('PaymentMethod Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/payment-methods/public', () => {
    it('should return 200 and list of public payment methods', async () => {
      const mockResult = {
        data: [{ name: 'Stripe', value: 'stripe' }],
        meta: { total: 1, page: 1, limit: 10 }
      };
      (PaymentMethodService.getPublicPaymentMethods as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/payment-methods/public');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
      expect(response.body.meta).toEqual(mockResult.meta);
    });
  });

  describe('POST /api/payment-methods', () => {
    it('should create a new payment method', async () => {
      const mockData = { name: 'PayPal', value: 'paypal', currencies: ['USD'] };
      (PaymentMethodService.createPaymentMethod as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app)
        .post('/api/payment-methods')
        .send(mockData);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });
  });
});
