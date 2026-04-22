import * as CreditsTransactionRepository from '../credits-transaction.repository';
import * as CreditsTransactionService from '../credits-transaction.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../credits-transaction.repository');
jest.mock('../../user-wallet/user-wallet.service', () => ({
  clearUserWalletCache: jest.fn(),
}));

describe('CreditsTransaction Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCreditsTransaction', () => {
    it('should return transaction if it exists', async () => {
      const mock = { _id: 'txn-1', credits: 50, type: 'increase' };
      (CreditsTransactionRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await CreditsTransactionService.getCreditsTransaction('txn-1');

      expect(result).toEqual(mock);
      expect(CreditsTransactionRepository.findById).toHaveBeenCalledWith('txn-1', true);
    });

    it('should throw 404 if not found', async () => {
      (CreditsTransactionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CreditsTransactionService.getCreditsTransaction('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found'));
    });
  });

  describe('createCreditsTransaction', () => {
    it('should create a transaction', async () => {
      const payload = { credits: 100, type: 'increase' } as any;
      const mock = { _id: 'txn-new', ...payload };
      (CreditsTransactionRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await CreditsTransactionService.createCreditsTransaction(payload);

      expect(result).toEqual(mock);
      expect(CreditsTransactionRepository.create).toHaveBeenCalledWith(payload, undefined);
    });
  });

  describe('executeCreditsTransaction', () => {
    it('should throw 404 if wallet not found', async () => {
      (CreditsTransactionRepository.findWalletById as jest.Mock).mockResolvedValue(null);

      const payload = { user_wallet: 'wallet-1', credits: 50, type: 'increase' } as any;
      await expect(CreditsTransactionService.executeCreditsTransaction(payload))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'User wallet not found'));
    });

    it('should throw 400 for insufficient credits on decrease', async () => {
      const wallet = { _id: 'wallet-1', credits: 10, user: 'user-1', email: 'a@b.com' };
      (CreditsTransactionRepository.findWalletById as jest.Mock).mockResolvedValue(wallet);

      const payload = { user_wallet: 'wallet-1', credits: 50, type: 'decrease' } as any;
      await expect(CreditsTransactionService.executeCreditsTransaction(payload))
        .rejects.toThrow(new AppError(httpStatus.BAD_REQUEST, 'Insufficient credits in wallet'));
    });

    it('should execute increase transaction successfully', async () => {
      const wallet = { _id: 'wallet-1', credits: 100, user: 'user-1', email: 'a@b.com' };
      const payload = { user_wallet: 'wallet-1', credits: 50, type: 'increase' } as any;
      const mock = { _id: 'txn-1', ...payload };
      (CreditsTransactionRepository.findWalletById as jest.Mock).mockResolvedValue(wallet);
      (CreditsTransactionRepository.updateWalletCredits as jest.Mock).mockResolvedValue(undefined);
      (CreditsTransactionRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await CreditsTransactionService.executeCreditsTransaction(payload);

      expect(result).toEqual(mock);
      expect(CreditsTransactionRepository.updateWalletCredits).toHaveBeenCalledWith('wallet-1', 50, undefined);
    });
  });

  describe('deleteCreditsTransaction', () => {
    it('should throw 404 if not found', async () => {
      (CreditsTransactionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CreditsTransactionService.deleteCreditsTransaction('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Credits transaction not found'));
    });
  });
});
