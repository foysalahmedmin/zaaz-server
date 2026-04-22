import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

// --- Mocks (paths relative to this __tests__ directory) ---
jest.mock('../payment-transaction.repository');
jest.mock('../payment-state-machine', () => ({
  PaymentStateMachine: { validate: jest.fn() },
}));
jest.mock('../payment.consumers', () => ({
  handlePaymentCompleted: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../payment-transaction.util', () => ({
  sendPaymentNotificationEmail: jest.fn(),
}));
jest.mock('../../../providers/payment-gateways', () => ({
  PaymentGatewayFactory: { create: jest.fn() },
}));
jest.mock('../../../config/rabbitmq', () => ({
  RabbitMQ: { publishToQueue: jest.fn() },
}));
jest.mock('../../../config/env', () => ({
  default: { rabbitmq_enabled: false, url: 'http://localhost:3000' },
}));
jest.mock('../../coupon/coupon.service', () => ({
  CouponServices: { validateCoupon: jest.fn() },
}));
jest.mock('../../../utils/currency.utils', () => ({
  getPriceInCurrency: jest.fn().mockImplementation((price: number) => price),
}));
jest.mock('../../package-price/package-price.model', () => ({
  PackagePrice: { findOne: jest.fn() },
}));
jest.mock('../../package/package.model', () => ({
  Package: { findById: jest.fn() },
}));
jest.mock('../../payment-method/payment-method.model', () => ({
  PaymentMethod: { findById: jest.fn() },
}));
jest.mock('../../interval/interval.model', () => ({
  Interval: { findById: jest.fn() },
}));
jest.mock('../../user-wallet/user-wallet.model', () => ({
  UserWallet: { findOne: jest.fn(), create: jest.fn() },
}));

import * as PaymentTransactionRepository from '../payment-transaction.repository';
import * as PaymentTransactionService from '../payment-transaction.service';
import { PaymentStateMachine } from '../payment-state-machine';
import { PaymentGatewayFactory } from '../../../providers/payment-gateways';
import { PackagePrice } from '../../package-price/package-price.model';
import { Package } from '../../package/package.model';
import { PaymentMethod } from '../../payment-method/payment-method.model';
import { Interval } from '../../interval/interval.model';
import { UserWallet } from '../../user-wallet/user-wallet.model';

const mockChain = (value: any) => ({
  session: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
  select: jest.fn().mockReturnThis(),
});

const ID1 = '507f1f77bcf86cd799439011';
const ID2 = '507f1f77bcf86cd799439012';
const ID3 = '507f1f77bcf86cd799439013';

describe('PaymentTransaction Service', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('getPaymentTransaction', () => {
    it('should return transaction when found', async () => {
      const mockTx = { _id: 'tx-1', status: 'pending', user: { toString: () => 'u-1' } };
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockChain(mockTx));

      const result = await PaymentTransactionService.getPaymentTransaction('tx-1');
      expect(result).toEqual(mockTx);
    });

    it('should throw 404 when transaction not found', async () => {
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockChain(null));

      await expect(PaymentTransactionService.getPaymentTransaction('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found'),
      );
    });

    it('should throw 403 when userId does not match owner', async () => {
      const mockTx = { _id: 'tx-1', user: { toString: () => 'owner-id' }, status: 'pending' };
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockChain(mockTx));

      await expect(
        PaymentTransactionService.getPaymentTransaction('tx-1', 'different-user'),
      ).rejects.toThrow(
        new AppError(httpStatus.FORBIDDEN, 'You do not have permission to access this payment transaction'),
      );
    });

    it('should return transaction when userId matches owner', async () => {
      const userId = 'owner-id';
      const mockTx = { _id: 'tx-1', user: { toString: () => userId }, status: 'success' };
      (PaymentTransactionRepository.PaymentTransaction.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockChain(mockTx));

      const result = await PaymentTransactionService.getPaymentTransaction('tx-1', userId);
      expect(result).toEqual(mockTx);
    });
  });

  // ------------------------------------------------------------------ //
  describe('updatePaymentTransactionStatus', () => {
    it('should throw 404 when transaction not found', async () => {
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(null);

      await expect(
        PaymentTransactionService.updatePaymentTransactionStatus('bad-id', 'success'),
      ).rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found'));
    });

    it('should return early when status is already the same and no additional updates', async () => {
      const mockTx = { _id: 'tx-1', status: 'pending' };
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(mockTx);
      (PaymentStateMachine.validate as jest.Mock).mockReturnValue(undefined);

      const result = await PaymentTransactionService.updatePaymentTransactionStatus('tx-1', 'pending');

      expect(result).toEqual(mockTx);
      expect(PaymentTransactionRepository.updateByIdWithSession).not.toHaveBeenCalled();
    });

    it('should set paid_at when transitioning to success', async () => {
      const mockTx = { _id: 'tx-1', status: 'pending', user: ID1, amount: 100, currency: 'USD', payment_method: ID2, package: ID3, interval: ID1 };
      const updatedTx = { ...mockTx, status: 'success', paid_at: new Date() };
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(mockTx);
      (PaymentStateMachine.validate as jest.Mock).mockReturnValue(undefined);
      (PaymentTransactionRepository.updateByIdWithSession as jest.Mock).mockResolvedValue(updatedTx);
      (PaymentTransactionRepository.createAuditLog as jest.Mock) = jest.fn();

      await PaymentTransactionService.updatePaymentTransactionStatus('tx-1', 'success');

      expect(PaymentTransactionRepository.updateByIdWithSession).toHaveBeenCalledWith(
        'tx-1',
        expect.objectContaining({ status: 'success', paid_at: expect.any(Date) }),
        null,
      );
    });

    it('should set failed_at when transitioning to failed', async () => {
      const mockTx = { _id: 'tx-1', status: 'pending', email: null };
      const updatedTx = { ...mockTx, status: 'failed', failed_at: new Date() };
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(mockTx);
      (PaymentStateMachine.validate as jest.Mock).mockReturnValue(undefined);
      (PaymentTransactionRepository.updateByIdWithSession as jest.Mock).mockResolvedValue(updatedTx);
      (PaymentTransactionRepository.createAuditLog as jest.Mock) = jest.fn();

      await PaymentTransactionService.updatePaymentTransactionStatus('tx-1', 'failed');

      expect(PaymentTransactionRepository.updateByIdWithSession).toHaveBeenCalledWith(
        'tx-1',
        expect.objectContaining({ status: 'failed', failed_at: expect.any(Date) }),
        null,
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('deletePaymentTransaction', () => {
    it('should soft-delete the transaction', async () => {
      (PaymentTransactionRepository.updateById as jest.Mock).mockResolvedValue(undefined);

      await PaymentTransactionService.deletePaymentTransaction('tx-1');

      expect(PaymentTransactionRepository.updateById).toHaveBeenCalledWith('tx-1', { is_deleted: true });
    });
  });

  // ------------------------------------------------------------------ //
  describe('restorePaymentTransaction', () => {
    it('should restore a soft-deleted transaction', async () => {
      const mockTx = { _id: 'tx-1', is_deleted: false };
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTx),
      });
      (PaymentTransactionRepository.PaymentTransaction.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      const result = await PaymentTransactionService.restorePaymentTransaction('tx-1');

      expect(result).toEqual(mockTx);
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'tx-1', is_deleted: true },
        { is_deleted: false },
        { new: true },
      );
    });

    it('should throw 404 if transaction not found or not deleted', async () => {
      (PaymentTransactionRepository.PaymentTransaction.findOneAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(PaymentTransactionService.restorePaymentTransaction('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found or not deleted'),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('initiatePayment', () => {
    const baseOptions = {
      userId: ID1,
      packageId: ID2,
      intervalId: ID3,
      paymentMethodId: ID1,
      returnUrl: 'http://return.com',
      cancelUrl: 'http://cancel.com',
      currency: 'USD' as const,
    };

    const mockPaymentMethod = { _id: ID1, name: 'stripe', is_active: true, currencies: ['USD'], is_test: false };
    const mockPackage = { _id: ID2, name: 'Starter', is_active: true };
    const mockInterval = { _id: ID3, name: 'Monthly', is_active: true, duration: 30 };
    const mockPackagePrice = { _id: ID1, price: 99, credits: 500 };
    const mockWallet = { _id: ID1, user: ID1, email: 'test@test.com' };

    beforeEach(() => {
      (PaymentMethod.findById as jest.Mock).mockReturnValue(mockChain(mockPaymentMethod));
      (Package.findById as jest.Mock).mockReturnValue(mockChain(mockPackage));
      (Interval.findById as jest.Mock).mockReturnValue(mockChain(mockInterval));
      (PackagePrice.findOne as jest.Mock).mockReturnValue(mockChain(mockPackagePrice));
      (UserWallet.findOne as jest.Mock).mockReturnValue(mockChain(mockWallet));
      (PaymentTransactionRepository.create as jest.Mock).mockResolvedValue([{ _id: 'tx-new' }]);
      (PaymentTransactionRepository.updateByIdWithSession as jest.Mock).mockResolvedValue(undefined);

      const mockGateway = {
        initiatePayment: jest.fn().mockResolvedValue({
          gatewayTransactionId: 'gw-tx-123',
          redirectUrl: 'http://gateway.com/pay',
        }),
      };
      (PaymentGatewayFactory.create as jest.Mock).mockReturnValue(mockGateway);
    });

    it('should throw BAD_REQUEST if payment method is not active', async () => {
      (PaymentMethod.findById as jest.Mock).mockReturnValue(
        mockChain({ ...mockPaymentMethod, is_active: false }),
      );

      await expect(PaymentTransactionService.initiatePayment(baseOptions)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Payment method not available'),
      );
    });

    it('should throw BAD_REQUEST if currency not supported by payment method', async () => {
      (PaymentMethod.findById as jest.Mock).mockReturnValue(
        mockChain({ ...mockPaymentMethod, currencies: ['BDT'] }),
      );

      await expect(PaymentTransactionService.initiatePayment(baseOptions)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Payment method stripe does not support USD'),
      );
    });

    it('should throw 404 if package not found or inactive', async () => {
      (Package.findById as jest.Mock).mockReturnValue(mockChain(null));

      await expect(PaymentTransactionService.initiatePayment(baseOptions)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package not found or inactive'),
      );
    });

    it('should throw BAD_REQUEST if interval not found or inactive', async () => {
      (Interval.findById as jest.Mock).mockReturnValue(mockChain(null));

      await expect(PaymentTransactionService.initiatePayment(baseOptions)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Interval not found or not active'),
      );
    });

    it('should throw BAD_REQUEST if package-price not found', async () => {
      (PackagePrice.findOne as jest.Mock).mockReturnValue(mockChain(null));

      await expect(PaymentTransactionService.initiatePayment(baseOptions)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Package-price not found or not active for this package and interval combination'),
      );
    });

    it('should create transaction and return redirect URL on success', async () => {
      const result = await PaymentTransactionService.initiatePayment(baseOptions);

      expect(PaymentTransactionRepository.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: 'pending', currency: 'USD', amount: 99 }),
        ]),
        expect.objectContaining({ session: undefined }),
      );
      expect(result.redirect_url).toBe('http://gateway.com/pay');
    });
  });
});
