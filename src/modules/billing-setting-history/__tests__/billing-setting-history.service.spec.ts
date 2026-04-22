import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../billing-setting-history.repository', () => ({
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  updateMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
  findOneAndRestore: jest.fn(),
  restoreMany: jest.fn(),
  BillingSettingHistory: { findById: jest.fn().mockReturnValue({ setOptions: jest.fn().mockResolvedValue(null) }) },
}));

import * as BillingSettingHistoryRepository from '../billing-setting-history.repository';
import * as BillingSettingHistoryService from '../billing-setting-history.service';

describe('BillingSettingHistory Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getBillingSettingHistory', () => {
    it('should return history if found', async () => {
      const mock = { _id: 'hist-1', billing_setting: 'bs-1' };
      (BillingSettingHistoryRepository.findById as jest.Mock).mockResolvedValue(mock);
      const result = await BillingSettingHistoryService.getBillingSettingHistory('hist-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (BillingSettingHistoryRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(BillingSettingHistoryService.getBillingSettingHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Billing Setting history not found'),
      );
    });
  });

  describe('deleteBillingSettingHistory', () => {
    it('should soft delete if found', async () => {
      (BillingSettingHistoryRepository.findMany as jest.Mock).mockResolvedValue([{ _id: 'hist-1' }]);
      (BillingSettingHistoryRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);
      await BillingSettingHistoryService.deleteBillingSettingHistory('hist-1');
      expect(BillingSettingHistoryRepository.softDeleteById).toHaveBeenCalledWith('hist-1');
    });

    it('should throw 404 if not found', async () => {
      (BillingSettingHistoryRepository.findMany as jest.Mock).mockResolvedValue([]);
      await expect(BillingSettingHistoryService.deleteBillingSettingHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Billing Setting history not found'),
      );
    });
  });
});
