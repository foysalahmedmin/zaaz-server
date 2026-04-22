import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../package-history.repository', () => ({
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  updateMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
  findOneAndRestore: jest.fn(),
  restoreMany: jest.fn(),
  PackageHistory: { findById: jest.fn().mockReturnValue({ setOptions: jest.fn().mockResolvedValue(null) }) },
}));

import * as PackageHistoryRepository from '../package-history.repository';
import * as PackageHistoryService from '../package-history.service';

describe('PackageHistory Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getPackageHistory', () => {
    it('should return history if found', async () => {
      const mock = { _id: 'hist-1', package: 'pkg-1' };
      (PackageHistoryRepository.findById as jest.Mock).mockResolvedValue(mock);
      const result = await PackageHistoryService.getPackageHistory('hist-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (PackageHistoryRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(PackageHistoryService.getPackageHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package history not found'),
      );
    });
  });

  describe('deletePackageHistory', () => {
    it('should soft delete if found', async () => {
      (PackageHistoryRepository.findMany as jest.Mock).mockResolvedValue([{ _id: 'hist-1' }]);
      (PackageHistoryRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);
      await PackageHistoryService.deletePackageHistory('hist-1');
      expect(PackageHistoryRepository.softDeleteById).toHaveBeenCalledWith('hist-1');
    });

    it('should throw 404 if not found', async () => {
      (PackageHistoryRepository.findMany as jest.Mock).mockResolvedValue([]);
      await expect(PackageHistoryService.deletePackageHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package history not found'),
      );
    });
  });

  describe('restorePackageHistory', () => {
    it('should restore if found', async () => {
      const mock = { _id: 'hist-1', is_deleted: false };
      (PackageHistoryRepository.findOneAndRestore as jest.Mock).mockResolvedValue(mock);
      const result = await PackageHistoryService.restorePackageHistory('hist-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (PackageHistoryRepository.findOneAndRestore as jest.Mock).mockResolvedValue(null);
      await expect(PackageHistoryService.restorePackageHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package history not found or not deleted'),
      );
    });
  });
});
