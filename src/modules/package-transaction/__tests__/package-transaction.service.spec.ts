import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../package-transaction.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdPopulated: jest.fn(),
  findMany: jest.fn(),
  findPaginated: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  updateMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
  findOneAndRestore: jest.fn(),
  restoreMany: jest.fn(),
}));
jest.mock('../../user-wallet/user-wallet.model', () => ({
  UserWallet: { findById: jest.fn().mockResolvedValue(null) },
}));
jest.mock('../../user-wallet/user-wallet.service', () => ({
  clearUserWalletCache: jest.fn().mockResolvedValue(undefined),
}));

import * as PackageTransactionRepository from '../package-transaction.repository';
import * as PackageTransactionService from '../package-transaction.service';

describe('PackageTransaction Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getPackageTransactionById', () => {
    it('should return transaction if found', async () => {
      const mock = { _id: 'tx-1', credits: 100 };
      (PackageTransactionRepository.findByIdPopulated as jest.Mock).mockResolvedValue(mock);
      const result = await PackageTransactionService.getPackageTransactionById('tx-1');
      expect(result).toEqual(mock);
    });
  });

  describe('deletePackageTransaction', () => {
    it('should throw 404 if not found', async () => {
      (PackageTransactionRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(PackageTransactionService.deletePackageTransaction('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package transaction not found'),
      );
    });

    it('should soft delete if found', async () => {
      const mock = { _id: 'tx-1', credits: 100, user_wallet: 'wallet-1' };
      (PackageTransactionRepository.findById as jest.Mock).mockResolvedValue(mock);
      (PackageTransactionRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await PackageTransactionService.deletePackageTransaction('tx-1');
      expect(PackageTransactionRepository.softDeleteById).toHaveBeenCalledWith('tx-1');
    });
  });

  describe('restorePackageTransaction', () => {
    it('should throw 404 if not found or not deleted', async () => {
      (PackageTransactionRepository.findOneAndRestore as jest.Mock).mockResolvedValue(null);
      await expect(PackageTransactionService.restorePackageTransaction('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package transaction not found or not deleted'),
      );
    });
  });
});
