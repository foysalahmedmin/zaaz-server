import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../credits-profit-history.repository', () => ({
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  updateMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
  findOneAndRestore: jest.fn(),
  restoreMany: jest.fn(),
  CreditsProfitHistory: { findById: jest.fn().mockReturnValue({ setOptions: jest.fn().mockResolvedValue(null) }) },
}));

import * as CreditsProfitHistoryRepository from '../credits-profit-history.repository';
import * as CreditsProfitHistoryService from '../credits-profit-history.service';

describe('CreditsProfitHistory Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getCreditsProfitHistory', () => {
    it('should return history if found', async () => {
      const mock = { _id: 'hist-1', credits_profit: 'cp-1' };
      (CreditsProfitHistoryRepository.findById as jest.Mock).mockResolvedValue(mock);
      const result = await CreditsProfitHistoryService.getCreditsProfitHistory('hist-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (CreditsProfitHistoryRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(CreditsProfitHistoryService.getCreditsProfitHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Credits profit history not found'),
      );
    });
  });

  describe('deleteCreditsProfitHistory', () => {
    it('should soft delete if found', async () => {
      (CreditsProfitHistoryRepository.findMany as jest.Mock).mockResolvedValue([{ _id: 'hist-1' }]);
      (CreditsProfitHistoryRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);
      await CreditsProfitHistoryService.deleteCreditsProfitHistory('hist-1');
      expect(CreditsProfitHistoryRepository.softDeleteById).toHaveBeenCalledWith('hist-1');
    });

    it('should throw 404 if not found', async () => {
      (CreditsProfitHistoryRepository.findMany as jest.Mock).mockResolvedValue([]);
      await expect(CreditsProfitHistoryService.deleteCreditsProfitHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Credits profit history not found'),
      );
    });
  });
});
