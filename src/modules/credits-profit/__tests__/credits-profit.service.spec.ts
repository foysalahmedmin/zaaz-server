import * as CreditsProfitRepository from '../credits-profit.repository';
import * as CreditsProfitService from '../credits-profit.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../credits-profit.repository');
jest.mock('../../../utils/cache.utils', () => ({
  withCache: jest.fn().mockImplementation((_key, _ttl, fetcher) => fetcher()),
  invalidateCache: jest.fn(),
  invalidateCacheByPattern: jest.fn(),
}));

describe('CreditsProfit Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCreditsProfit', () => {
    it('should return a credits profit if it exists', async () => {
      const mock = { _id: 'profit-1', name: 'Base', percentage: 10 };
      (CreditsProfitRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await CreditsProfitService.getCreditsProfit('profit-1');

      expect(result).toEqual(mock);
      expect(CreditsProfitRepository.findById).toHaveBeenCalledWith('profit-1');
    });

    it('should throw 404 if not found', async () => {
      (CreditsProfitRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CreditsProfitService.getCreditsProfit('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Credits profit not found'));
    });
  });

  describe('createCreditsProfit', () => {
    it('should create and invalidate cache', async () => {
      const payload = { name: 'Base', percentage: 10, is_active: true } as any;
      const mock = { _id: 'profit-new', ...payload };
      (CreditsProfitRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await CreditsProfitService.createCreditsProfit(payload);

      expect(result).toEqual(mock);
      expect(CreditsProfitRepository.create).toHaveBeenCalledWith(payload, undefined);
    });
  });

  describe('updateCreditsProfit', () => {
    it('should update and create history', async () => {
      const existing = { _id: 'profit-1', name: 'Old', percentage: 5, is_active: true, is_deleted: false };
      const updated = { _id: 'profit-1', name: 'New', percentage: 15, is_active: true };
      (CreditsProfitRepository.findById as jest.Mock).mockResolvedValue(existing);
      (CreditsProfitRepository.createHistory as jest.Mock).mockResolvedValue(undefined);
      (CreditsProfitRepository.updateById as jest.Mock).mockResolvedValue(updated);

      const result = await CreditsProfitService.updateCreditsProfit('profit-1', { name: 'New', percentage: 15 });

      expect(result).toEqual(updated);
      expect(CreditsProfitRepository.createHistory).toHaveBeenCalled();
    });

    it('should throw 404 if not found', async () => {
      (CreditsProfitRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CreditsProfitService.updateCreditsProfit('bad-id', {}))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Credits profit not found'));
    });
  });

  describe('deleteCreditsProfit', () => {
    it('should soft delete if exists', async () => {
      const existing = { _id: 'profit-1', name: 'Base' };
      (CreditsProfitRepository.findById as jest.Mock).mockResolvedValue(existing);
      (CreditsProfitRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await CreditsProfitService.deleteCreditsProfit('profit-1');

      expect(CreditsProfitRepository.softDeleteById).toHaveBeenCalledWith('profit-1');
    });

    it('should throw 404 if not found', async () => {
      (CreditsProfitRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CreditsProfitService.deleteCreditsProfit('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Credits profit not found'));
    });
  });

  describe('getTotalProfitPercentage', () => {
    it('should return total percentage via cache', async () => {
      (CreditsProfitRepository.getTotalProfitPercentage as jest.Mock).mockResolvedValue(35);

      const result = await CreditsProfitService.getTotalProfitPercentage();

      expect(result).toBe(35);
    });
  });
});
