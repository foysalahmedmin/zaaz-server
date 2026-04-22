import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../user-wallet.repository', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  findMany: jest.fn(),
  findPaginated: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
  findOneAndRestore: jest.fn(),
  restoreMany: jest.fn(),
  UserWallet: { findByIdAndDelete: jest.fn() },
}));
jest.mock('../../../utils/cache.utils', () => ({
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  withCache: jest.fn().mockImplementation((_key: any, _ttl: any, fn: any) => fn()),
}));
jest.mock('../../package-price/package-price.model', () => ({
  PackagePrice: { findOne: jest.fn() },
}));
jest.mock('../../interval/interval.model', () => ({
  Interval: { findById: jest.fn() },
}));
jest.mock('../../credits-transaction/credits-transaction.model', () => ({
  CreditsTransaction: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../../package-transaction/package-transaction.model', () => ({
  PackageTransaction: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../../package/package.model', () => ({
  Package: { findOne: jest.fn(), findById: jest.fn() },
}));
jest.mock('../../package-history/package-history.model', () => ({
  PackageHistory: { findOne: jest.fn() },
}));
jest.mock('../../user-subscription/user-subscription.service', () => ({
  createSubscription: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../package-price/package-price.service', () => ({
  getPackagePricesByPackage: jest.fn(),
}));

import * as UserWalletRepository from '../user-wallet.repository';
import * as UserWalletService from '../user-wallet.service';
import { PackagePrice } from '../../package-price/package-price.model';
import { Interval } from '../../interval/interval.model';
import { CreditsTransaction } from '../../credits-transaction/credits-transaction.model';
import { PackageTransaction } from '../../package-transaction/package-transaction.model';
import { Package } from '../../package/package.model';
import { PackageHistory } from '../../package-history/package-history.model';
import { getPackagePricesByPackage } from '../../package-price/package-price.service';
import { createSubscription } from '../../user-subscription/user-subscription.service';

const mockChainSession = (value: any) => ({
  session: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
  sort: jest.fn().mockReturnThis(),
});

const ID1 = '507f1f77bcf86cd799439011';
const ID2 = '507f1f77bcf86cd799439012';

describe('UserWallet Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('createUserWallet', () => {
    it('should create wallet if user does not have one', async () => {
      const payload = { user: 'user-1', credits: 0, initial_credits_given: false } as any;
      const mock = { _id: 'wallet-1', ...payload };
      (UserWalletRepository.findOne as jest.Mock).mockResolvedValue(null);
      (UserWalletRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await UserWalletService.createUserWallet(payload);
      expect(result).toEqual(mock);
    });

    it('should throw BAD_REQUEST if wallet already exists', async () => {
      const payload = { user: 'user-1', credits: 0 } as any;
      (UserWalletRepository.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      await expect(UserWalletService.createUserWallet(payload)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'User already has a wallet. Update existing wallet instead.'),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('getUserWalletById', () => {
    it('should return wallet if found', async () => {
      const mock = { _id: 'wallet-1', credits: 100 };
      (UserWalletRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await UserWalletService.getUserWalletById('wallet-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if wallet not found', async () => {
      (UserWalletRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserWalletService.getUserWalletById('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found'),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('decrementWalletCredits', () => {
    it('should decrement credits and return updated wallet', async () => {
      const mock = { _id: 'w-1', user: 'u-1', credits: 50, toObject: () => ({ _id: 'w-1', credits: 50 }) };
      (UserWalletRepository.findOneAndUpdate as jest.Mock).mockResolvedValue(mock);

      const result = await UserWalletService.decrementWalletCredits('u-1', 50);
      expect(UserWalletRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { user: 'u-1' },
        { $inc: { credits: -50 } },
        undefined,
      );
      expect(result).toEqual({ _id: 'w-1', credits: 50 });
    });

    it('should throw 404 if wallet not found', async () => {
      (UserWalletRepository.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(UserWalletService.decrementWalletCredits('bad', 10)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found'),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('deleteUserWallet', () => {
    it('should soft-delete wallet if found', async () => {
      const mock = { _id: 'wallet-1', user: 'user-1' };
      (UserWalletRepository.findById as jest.Mock).mockResolvedValue(mock);
      (UserWalletRepository.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);

      await UserWalletService.deleteUserWallet('wallet-1');
      expect(UserWalletRepository.findByIdAndUpdate).toHaveBeenCalledWith('wallet-1', { is_deleted: true });
    });

    it('should throw 404 if wallet not found', async () => {
      (UserWalletRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserWalletService.deleteUserWallet('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found'),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('restoreUserWallet', () => {
    it('should restore deleted wallet', async () => {
      const mock = { _id: 'wallet-1', user: 'user-1', is_deleted: false };
      (UserWalletRepository.findOneAndRestore as jest.Mock).mockResolvedValue(mock);

      const result = await UserWalletService.restoreUserWallet('wallet-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if wallet not found or not deleted', async () => {
      (UserWalletRepository.findOneAndRestore as jest.Mock).mockResolvedValue(null);

      await expect(UserWalletService.restoreUserWallet('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found or not deleted'),
      );
    });
  });

  // ------------------------------------------------------------------ //
  describe('giveInitialPackage', () => {
    it('should throw UNAUTHORIZED if user is not verified', async () => {
      await expect(
        UserWalletService.giveInitialPackage('user-1', false),
      ).rejects.toThrow(new AppError(httpStatus.UNAUTHORIZED, 'User is not verified'));
    });

    it('should throw 404 if no initial package exists', async () => {
      (Package.findOne as jest.Mock).mockReturnValue(mockChainSession(null));

      await expect(
        UserWalletService.giveInitialPackage('user-1', true),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'No initial package found. Please set a package as initial first.'),
      );
    });

    it('should throw 404 if no initial price found for initial package', async () => {
      const mockPkg = { _id: ID1, name: 'Free' };
      (Package.findOne as jest.Mock).mockReturnValue(mockChainSession(mockPkg));
      (getPackagePricesByPackage as jest.Mock).mockResolvedValue([
        { _id: ID2, is_initial: false, interval: ID1 },
      ]);

      await expect(
        UserWalletService.giveInitialPackage('user-1', true),
      ).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'No initial price found for the initial package.'),
      );
    });

    it('should throw 404 if interval for initial price not found', async () => {
      const mockPkg = { _id: ID1, name: 'Free' };
      const mockPrice = { _id: ID2, is_initial: true, interval: ID1 };
      (Package.findOne as jest.Mock).mockReturnValue(mockChainSession(mockPkg));
      (getPackagePricesByPackage as jest.Mock).mockResolvedValue([mockPrice]);
      (Interval.findById as jest.Mock).mockReturnValue(mockChainSession(null));

      await expect(
        UserWalletService.giveInitialPackage('user-1', true),
      ).rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Interval not found'));
    });
  });

  // ------------------------------------------------------------------ //
  describe('assignPackage', () => {
    const USER_ID = '507f1f77bcf86cd799439020';
    const PKG_ID = '507f1f77bcf86cd799439021';
    const INTERVAL_ID = '507f1f77bcf86cd799439022';
    const TX_ID = '507f1f77bcf86cd799439023';

    const data = {
      user_id: USER_ID,
      package_id: PKG_ID,
      interval_id: INTERVAL_ID,
      increase_source: 'payment' as const,
      payment_transaction_id: TX_ID,
    };

    const HIST_ID = '507f1f77bcf86cd799439024';
    const mockPackagePrice = { _id: PKG_ID, credits: 500, package: PKG_ID, interval: INTERVAL_ID };
    const mockInterval = { _id: INTERVAL_ID, name: 'Monthly', duration: 30 };
    const mockWallet = { _id: ID1, user: USER_ID, toObject: () => ({ _id: ID1, credits: 500 }) };

    beforeEach(() => {
      (CreditsTransaction.findOne as jest.Mock).mockReturnValue(mockChainSession(null));
      (PackagePrice.findOne as jest.Mock).mockReturnValue(mockChainSession(mockPackagePrice));
      (Interval.findById as jest.Mock).mockReturnValue(mockChainSession(mockInterval));
      (UserWalletRepository.findOne as jest.Mock).mockResolvedValue({ _id: ID1 });
      (UserWalletRepository.findOneAndUpdate as jest.Mock).mockResolvedValue(mockWallet);
      (Package.findById as jest.Mock) = jest.fn().mockReturnValue(mockChainSession({ _id: PKG_ID, version: 1 }));
      (PackageHistory.findOne as jest.Mock) = jest.fn().mockReturnValue({
        ...mockChainSession({ _id: HIST_ID }),
        sort: jest.fn().mockReturnThis(),
      });
      (PackageTransaction.findOne as jest.Mock).mockReturnValue(mockChainSession(null));
      (PackageTransaction.create as jest.Mock).mockResolvedValue(undefined);
      (CreditsTransaction.create as jest.Mock).mockResolvedValue(undefined);
      (createSubscription as jest.Mock).mockResolvedValue(undefined);
    });

    it('should return existing wallet if payment transaction already processed (idempotency)', async () => {
      const existingWallet = { _id: ID1, credits: 100 };
      (CreditsTransaction.findOne as jest.Mock).mockReturnValue(
        mockChainSession({ _id: ID1, type: 'increase' }),
      );
      (UserWalletRepository.findOne as jest.Mock).mockResolvedValue(existingWallet);

      const result = await UserWalletService.assignPackage(data);
      expect(result).toEqual(existingWallet);
    });

    it('should throw 404 if package-price not found or not active', async () => {
      (CreditsTransaction.findOne as jest.Mock).mockReturnValue(mockChainSession(null));
      (PackagePrice.findOne as jest.Mock).mockReturnValue(mockChainSession(null));

      await expect(UserWalletService.assignPackage(data)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package price not found or not active'),
      );
    });

    it('should throw 404 if interval not found', async () => {
      (CreditsTransaction.findOne as jest.Mock).mockReturnValue(mockChainSession(null));
      (Interval.findById as jest.Mock).mockReturnValue(mockChainSession(null));

      await expect(UserWalletService.assignPackage(data)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Interval not found'),
      );
    });

    it('should assign package and return updated wallet', async () => {
      const result = await UserWalletService.assignPackage(data);

      expect(UserWalletRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { user: USER_ID },
        expect.objectContaining({ $inc: { credits: 500 } }),
        undefined,
      );
      expect(createSubscription).toHaveBeenCalled();
      expect(result).toEqual({ _id: ID1, credits: 500 });
    });

    it('should throw 404 if wallet not found after update', async () => {
      (CreditsTransaction.findOne as jest.Mock).mockReturnValue(mockChainSession(null));
      (UserWalletRepository.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(UserWalletService.assignPackage(data)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found'),
      );
    });
  });
});
