import * as CreditsUsageRepository from '../credits-usage.repository';
import * as CreditsUsageService from '../credits-usage.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../credits-usage.repository');

describe('CreditsUsage Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCreditsUsageById', () => {
    it('should return log if it exists', async () => {
      const mockResult = { _id: 'usage-1', credits: 10 };
      (CreditsUsageRepository.findById as jest.Mock).mockResolvedValue(mockResult);

      const result = await CreditsUsageService.getCreditsUsageById('usage-1');

      expect(result).toEqual(mockResult);
      expect(CreditsUsageRepository.findById).toHaveBeenCalledWith('usage-1');
    });

    it('should throw 404 if log not found', async () => {
      (CreditsUsageRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(CreditsUsageService.getCreditsUsageById('invalid-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Credits usage log not found'));
    });
  });

  describe('createCreditsUsage', () => {
    it('should create credits usage log', async () => {
      const mockPayload = { user: 'user-id', usage_key: 'test', cost_credits: 5 } as any;
      const mockResult = { _id: 'usage-new', ...mockPayload };
      (CreditsUsageRepository.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await CreditsUsageService.createCreditsUsage(mockPayload);
      expect(result).toEqual(mockResult);
      expect(CreditsUsageRepository.create).toHaveBeenCalledWith(mockPayload, undefined);
    });
  });
});
