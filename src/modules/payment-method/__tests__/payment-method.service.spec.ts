import * as PaymentMethodRepository from '../payment-method.repository';
import * as PaymentMethodService from '../payment-method.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../payment-method.repository');

describe('PaymentMethod Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPaymentMethod', () => {
    it('should return a payment method if it exists', async () => {
      const mockPM = { _id: 'pm-id', name: 'Stripe', value: 'stripe' };
      (PaymentMethodRepository.findById as jest.Mock).mockResolvedValue(mockPM);

      const result = await PaymentMethodService.getPaymentMethod('pm-id');

      expect(result).toEqual(mockPM);
      expect(PaymentMethodRepository.findById).toHaveBeenCalledWith('pm-id');
    });

    it('should throw 404 if payment method does not exist', async () => {
      (PaymentMethodRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(PaymentMethodService.getPaymentMethod('non-existent'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Payment method not found'));
    });
  });

  describe('createPaymentMethod', () => {
    it('should create and return a payment method', async () => {
      const mockData = { name: 'PayPal', value: 'paypal', currencies: ['USD'] } as any;
      (PaymentMethodRepository.create as jest.Mock).mockResolvedValue(mockData);

      const result = await PaymentMethodService.createPaymentMethod(mockData);

      expect(result).toEqual(mockData);
      expect(PaymentMethodRepository.create).toHaveBeenCalledWith(mockData);
    });
  });
});
