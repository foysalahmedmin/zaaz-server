import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../../payment-transaction/payment-transaction.repository');
jest.mock('../payment-state-machine', () => ({
  PaymentStateMachine: { validate: jest.fn() },
}));
jest.mock('../payment.consumers', () => ({
  handlePaymentCompleted: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../payment.util', () => ({
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

import * as PaymentTransactionRepository from '../../payment-transaction/payment-transaction.repository';
import * as PaymentService from '../payment.service';
import { PaymentStateMachine } from '../payment-state-machine';
import { PaymentGatewayFactory } from '../../../providers/payment-gateways';
import { PackagePrice } from '../../package-price/package-price.model';
import { Package } from '../../package/package.model';
import { PaymentMethod } from '../../payment-method/payment-method.model';
import { Interval } from '../../interval/interval.model';
import { UserWallet } from '../../user-wallet/user-wallet.model';

const mock_chain = (value: any) => ({
  session: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
  select: jest.fn().mockReturnThis(),
});

const ID1 = '507f1f77bcf86cd799439011';
const ID2 = '507f1f77bcf86cd799439012';
const ID3 = '507f1f77bcf86cd799439013';

describe('Payment Service — Business Logic', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('updatePaymentTransactionStatus', () => {
    it('should throw 404 when transaction not found', async () => {
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(null);

      await expect(
        PaymentService.updatePaymentTransactionStatus('bad-id', 'success'),
      ).rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Payment transaction not found'));
    });

    it('should return early when status is already the same', async () => {
      const mock_tx = { _id: ID1, status: 'pending' };
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(mock_tx);
      (PaymentStateMachine.validate as jest.Mock).mockReturnValue(undefined);

      const result = await PaymentService.updatePaymentTransactionStatus('tx-1', 'pending');

      expect(result).toEqual(mock_tx);
      expect(PaymentTransactionRepository.updateByIdWithSession).not.toHaveBeenCalled();
    });

    it('should set paid_at when transitioning to success', async () => {
      const mock_tx = {
        _id: ID1,
        status: 'pending',
        user: ID1,
        amount: 100,
        currency: 'USD',
        payment_method: ID2,
        package: ID3,
        interval: ID1,
        email: null,
      };
      const updated_tx = { ...mock_tx, status: 'success', paid_at: new Date() };
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(mock_tx);
      (PaymentStateMachine.validate as jest.Mock).mockReturnValue(undefined);
      (PaymentTransactionRepository.updateByIdWithSession as jest.Mock).mockResolvedValue(updated_tx);
      (PaymentTransactionRepository.createAuditLog as jest.Mock) = jest.fn();

      await PaymentService.updatePaymentTransactionStatus('tx-1', 'success');

      expect(PaymentTransactionRepository.updateByIdWithSession).toHaveBeenCalledWith(
        'tx-1',
        expect.objectContaining({ status: 'success', paid_at: expect.any(Date) }),
        null,
      );
    });

    it('should set failed_at when transitioning to failed', async () => {
      const mock_tx = { _id: ID1, status: 'pending', email: null };
      const updated_tx = { ...mock_tx, status: 'failed', failed_at: new Date() };
      (PaymentTransactionRepository.findByIdWithSession as jest.Mock).mockResolvedValue(mock_tx);
      (PaymentStateMachine.validate as jest.Mock).mockReturnValue(undefined);
      (PaymentTransactionRepository.updateByIdWithSession as jest.Mock).mockResolvedValue(updated_tx);
      (PaymentTransactionRepository.createAuditLog as jest.Mock) = jest.fn();

      await PaymentService.updatePaymentTransactionStatus('tx-1', 'failed');

      expect(PaymentTransactionRepository.updateByIdWithSession).toHaveBeenCalledWith(
        'tx-1',
        expect.objectContaining({ status: 'failed', failed_at: expect.any(Date) }),
        null,
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('initiatePayment', () => {
    const base_options = {
      user_id: ID1,
      package_id: ID2,
      interval_id: ID3,
      payment_method_id: ID1,
      return_url: 'http://return.com',
      cancel_url: 'http://cancel.com',
      currency: 'USD' as const,
    };

    const mock_payment_method = { _id: ID1, name: 'stripe', is_active: true, currencies: ['USD'], is_test: false };
    const mock_package = { _id: ID2, name: 'Starter', is_active: true };
    const mock_interval = { _id: ID3, name: 'Monthly', is_active: true, duration: 30 };
    const mock_package_price = { _id: ID1, price: 99, credits: 500 };
    const mock_wallet = { _id: ID1, user: ID1, email: 'test@test.com' };

    beforeEach(() => {
      (PaymentMethod.findById as jest.Mock).mockReturnValue(mock_chain(mock_payment_method));
      (Package.findById as jest.Mock).mockReturnValue(mock_chain(mock_package));
      (Interval.findById as jest.Mock).mockReturnValue(mock_chain(mock_interval));
      (PackagePrice.findOne as jest.Mock).mockReturnValue(mock_chain(mock_package_price));
      (UserWallet.findOne as jest.Mock).mockReturnValue(mock_chain(mock_wallet));
      (PaymentTransactionRepository.create as jest.Mock).mockResolvedValue([{ _id: 'tx-new' }]);
      (PaymentTransactionRepository.updateByIdWithSession as jest.Mock).mockResolvedValue(undefined);

      const mock_gateway = {
        initiatePayment: jest.fn().mockResolvedValue({
          gatewayTransactionId: 'gw-tx-123',
          redirectUrl: 'http://gateway.com/pay',
        }),
      };
      (PaymentGatewayFactory.create as jest.Mock).mockReturnValue(mock_gateway);
    });

    it('should throw BAD_REQUEST if payment method is not active', async () => {
      (PaymentMethod.findById as jest.Mock).mockReturnValue(
        mock_chain({ ...mock_payment_method, is_active: false }),
      );

      await expect(PaymentService.initiatePayment(base_options)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Payment method not available'),
      );
    });

    it('should throw BAD_REQUEST if currency not supported', async () => {
      (PaymentMethod.findById as jest.Mock).mockReturnValue(
        mock_chain({ ...mock_payment_method, currencies: ['BDT'] }),
      );

      await expect(PaymentService.initiatePayment(base_options)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Payment method stripe does not support USD'),
      );
    });

    it('should throw 404 if package not found or inactive', async () => {
      (Package.findById as jest.Mock).mockReturnValue(mock_chain(null));

      await expect(PaymentService.initiatePayment(base_options)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package not found or inactive'),
      );
    });

    it('should throw BAD_REQUEST if interval not found or inactive', async () => {
      (Interval.findById as jest.Mock).mockReturnValue(mock_chain(null));

      await expect(PaymentService.initiatePayment(base_options)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Interval not found or not active'),
      );
    });

    it('should throw BAD_REQUEST if package-price not found', async () => {
      (PackagePrice.findOne as jest.Mock).mockReturnValue(mock_chain(null));

      await expect(PaymentService.initiatePayment(base_options)).rejects.toThrow(
        new AppError(
          httpStatus.BAD_REQUEST,
          'Package-price not found or not active for this package and interval combination',
        ),
      );
    });

    it('should create transaction and return redirect URL on success', async () => {
      const result = await PaymentService.initiatePayment(base_options);

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
