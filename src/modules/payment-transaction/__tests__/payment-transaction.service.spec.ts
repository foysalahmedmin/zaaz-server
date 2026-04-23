import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../payment-transaction.repository');
jest.mock('../../../config/env', () => ({
  default: { rabbitmq_enabled: false, url: 'http://localhost:3000' },
}));

import * as PaymentTransactionRepository from '../payment-transaction.repository';
import * as PaymentTransactionService from '../payment-transaction.service';

const mock_chain = (value: any) => ({
  session: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
  select: jest.fn().mockReturnThis(),
  setOptions: jest.fn().mockReturnThis(),
});

const ID1 = '507f1f77bcf86cd799439011';

describe('PaymentTransaction Service — CRUD', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('getPaymentTransaction', () => {
    it('should return transaction when found', async () => {
      const mock_tx = { _id: ID1, status: 'pending', user: { toString: () => 'u-1' } };
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mock_chain(mock_tx));

      const result = await PaymentTransactionService.getPaymentTransaction(ID1);
      expect(result).toEqual(mock_tx);
    });

    it('should throw 404 when not found', async () => {
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mock_chain(null));

      await expect(PaymentTransactionService.getPaymentTransaction('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found'),
      );
    });

    it('should throw 403 when user_id does not match owner', async () => {
      const mock_tx = { _id: ID1, user: { toString: () => 'owner-id' }, status: 'pending' };
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mock_chain(mock_tx));

      await expect(
        PaymentTransactionService.getPaymentTransaction(ID1, 'different-user'),
      ).rejects.toThrow(
        new AppError(httpStatus.FORBIDDEN, 'You do not have permission to access this payment transaction'),
      );
    });

    it('should return transaction when user_id matches owner', async () => {
      const user_id = 'owner-id';
      const mock_tx = { _id: ID1, user: { toString: () => user_id }, status: 'success' };
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mock_chain(mock_tx));

      const result = await PaymentTransactionService.getPaymentTransaction(ID1, user_id);
      expect(result).toEqual(mock_tx);
    });
  });

  // ------------------------------------------------------------------ //
  describe('deletePaymentTransaction', () => {
    it('should soft-delete the transaction', async () => {
      (PaymentTransactionRepository.updateById as jest.Mock).mockResolvedValue(undefined);

      await PaymentTransactionService.deletePaymentTransaction('tx-1');

      expect(PaymentTransactionRepository.updateById).toHaveBeenCalledWith('tx-1', {
        is_deleted: true,
      });
    });
  });

  // ------------------------------------------------------------------ //
  describe('restorePaymentTransaction', () => {
    it('should restore a soft-deleted transaction', async () => {
      const mock_tx = { _id: ID1, is_deleted: false };
      const mock_find_one_and_update = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mock_tx),
      });
      (PaymentTransactionRepository.PaymentTransaction.findOneAndUpdate as jest.Mock) =
        mock_find_one_and_update;

      const result = await PaymentTransactionService.restorePaymentTransaction(ID1);

      expect(result).toEqual(mock_tx);
      expect(mock_find_one_and_update).toHaveBeenCalledWith(
        { _id: ID1, is_deleted: true },
        { is_deleted: false },
        { new: true },
      );
    });

    it('should throw 404 if transaction not found or not deleted', async () => {
      (PaymentTransactionRepository.PaymentTransaction.findOneAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(
        PaymentTransactionService.restorePaymentTransaction('bad'),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found or not deleted'),
      );
    });
  });
});
