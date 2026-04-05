import * as PaymentTransactionRepository from '../payment-transaction.repository';
import * as PaymentTransactionService from '../payment-transaction.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../payment-transaction.repository');

describe('PaymentTransaction Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPaymentTransaction', () => {
    it('should return a transaction if it exists', async () => {
      const mockTx = { _id: 'tx-123', status: 'pending', amount: 100, user: 'user-123' };
      // Note: Repository must export the model for populate tests, or we mock the model separately
      // but the service calls PaymentTransactionRepository.PaymentTransaction.findById
      const mockFindById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTx),
      });
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = mockFindById;

      const result = await PaymentTransactionService.getPaymentTransaction('tx-123');

      expect(result).toEqual(mockTx);
    });

    it('should throw 404 if transaction does not exist', async () => {
      const mockFindById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = mockFindById;

      await expect(PaymentTransactionService.getPaymentTransaction('non-existent'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found'));
    });
  });
});
