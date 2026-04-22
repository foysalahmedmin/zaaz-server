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

import * as UserWalletRepository from '../user-wallet.repository';
import * as UserWalletService from '../user-wallet.service';

describe('UserWallet Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

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
      (UserWalletRepository.findOne as jest.Mock).mockResolvedValue({ _id: 'existing-wallet' });

      await expect(UserWalletService.createUserWallet(payload)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'User already has a wallet. Update existing wallet instead.'),
      );
    });
  });

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

  describe('deleteUserWallet', () => {
    it('should soft delete wallet if found', async () => {
      const mock = { _id: 'wallet-1', user: 'user-1' };
      (UserWalletRepository.findById as jest.Mock).mockResolvedValue(mock);
      (UserWalletRepository.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);

      await UserWalletService.deleteUserWallet('wallet-1');
      expect(UserWalletRepository.findByIdAndUpdate).toHaveBeenCalledWith(
        'wallet-1',
        { is_deleted: true },
      );
    });

    it('should throw 404 if wallet not found', async () => {
      (UserWalletRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(UserWalletService.deleteUserWallet('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'User wallet not found'),
      );
    });
  });

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
});
