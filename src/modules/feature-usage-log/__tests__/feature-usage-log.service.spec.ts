import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../feature-usage-log.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdRaw: jest.fn(),
  findMany: jest.fn(),
  findPaginated: jest.fn(),
  aggregate: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  updateMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
}));
jest.mock('../../feature-endpoint/feature-endpoint.model', () => ({
  FeatureEndpoint: { find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([]) }) },
}));
jest.mock('../../feature-endpoint/feature-endpoint.service', () => ({
  getPublicFeatureEndpointByIdOrValue: jest.fn(),
}));
jest.mock('../feature-usage-log.validator', () => ({
  createFeatureUsageLogValidationSchema: {
    shape: { body: { parse: jest.fn((d: any) => d) } },
  },
}));

import * as FeatureUsageLogRepository from '../feature-usage-log.repository';
import * as FeatureUsageLogService from '../feature-usage-log.service';

describe('FeatureUsageLog Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createFeatureUsageLog', () => {
    it('should create a log entry', async () => {
      const payload = { user: 'user-1', email: 'u@test.com', status: 'success' } as any;
      const mock = { _id: 'log-1', ...payload };
      (FeatureUsageLogRepository.create as jest.Mock).mockResolvedValue(mock);
      const result = await FeatureUsageLogService.createFeatureUsageLog(payload);
      expect(result).toEqual(mock);
    });
  });

  describe('getFeatureUsageLog', () => {
    it('should return log if found', async () => {
      const mock = { _id: 'log-1', status: 'success' };
      (FeatureUsageLogRepository.findById as jest.Mock).mockResolvedValue(mock);
      const result = await FeatureUsageLogService.getFeatureUsageLog('log-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (FeatureUsageLogRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(FeatureUsageLogService.getFeatureUsageLog('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found'),
      );
    });
  });

  describe('deleteFeatureUsageLog', () => {
    it('should soft delete if found', async () => {
      (FeatureUsageLogRepository.findMany as jest.Mock).mockResolvedValue([{ _id: 'log-1' }]);
      (FeatureUsageLogRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);
      await FeatureUsageLogService.deleteFeatureUsageLog('log-1');
      expect(FeatureUsageLogRepository.softDeleteById).toHaveBeenCalledWith('log-1');
    });

    it('should throw 404 if not found', async () => {
      (FeatureUsageLogRepository.findMany as jest.Mock).mockResolvedValue([]);
      await expect(FeatureUsageLogService.deleteFeatureUsageLog('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found'),
      );
    });
  });
});
