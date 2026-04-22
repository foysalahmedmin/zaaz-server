import * as BillingSettingRepository from '../billing-setting.repository';
import * as BillingSettingService from '../billing-setting.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../billing-setting.repository');
jest.mock('../../../utils/cache.utils', () => ({
  withCache: jest.fn().mockImplementation((_key, _ttl, fetcher) => fetcher()),
}));
jest.mock('../../credits-process/credits-process.service', () => ({
  clearCreditsProcessCache: jest.fn(),
}));
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  };
});

describe('BillingSetting Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBillingSetting', () => {
    it('should return a setting if it exists', async () => {
      const mock = { _id: 'setting-1', credit_price: 0.01 };
      (BillingSettingRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await BillingSettingService.getBillingSetting('setting-1');

      expect(result).toEqual(mock);
      expect(BillingSettingRepository.findById).toHaveBeenCalledWith('setting-1');
    });

    it('should throw 404 if not found', async () => {
      (BillingSettingRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(BillingSettingService.getBillingSetting('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found'));
    });
  });

  describe('getInitialBillingSetting', () => {
    it('should return the initial setting', async () => {
      const mock = { _id: 'setting-1', credit_price: 0.01, is_initial: true };
      (BillingSettingRepository.findOne as jest.Mock).mockResolvedValue(mock);

      const result = await BillingSettingService.getInitialBillingSetting();

      expect(result).toEqual(mock);
    });

    it('should return default setting if no initial found', async () => {
      (BillingSettingRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await BillingSettingService.getInitialBillingSetting();

      expect(result).toBeDefined();
    });
  });

  describe('deleteBillingSetting', () => {
    it('should soft delete if exists', async () => {
      const mock = { _id: 'setting-1', credit_price: 0.01 };
      (BillingSettingRepository.softDeleteById as jest.Mock).mockResolvedValue(mock);

      await BillingSettingService.deleteBillingSetting('setting-1');

      expect(BillingSettingRepository.softDeleteById).toHaveBeenCalledWith('setting-1');
    });

    it('should throw 404 if not found', async () => {
      (BillingSettingRepository.softDeleteById as jest.Mock).mockResolvedValue(null);

      await expect(BillingSettingService.deleteBillingSetting('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found'));
    });
  });

  describe('restoreBillingSetting', () => {
    it('should restore if found as deleted', async () => {
      const mock = { _id: 'setting-1', is_deleted: false };
      (BillingSettingRepository.restore as jest.Mock).mockResolvedValue(mock);

      const result = await BillingSettingService.restoreBillingSetting('setting-1');

      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found or not deleted', async () => {
      (BillingSettingRepository.restore as jest.Mock).mockResolvedValue(null);

      await expect(BillingSettingService.restoreBillingSetting('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found or not deleted'));
    });
  });
});
