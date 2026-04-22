import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../feature-endpoint.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findPaginated: jest.fn(),
  updateById: jest.fn(),
  updateMany: jest.fn(),
  findByIds: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  softDeleteMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
  restore: jest.fn(),
  restoreMany: jest.fn(),
}));
jest.mock('../../../utils/cache.utils', () => ({
  withCache: jest.fn().mockImplementation((_k, _t, fn) => fn()),
  invalidateCacheByPattern: jest.fn(),
}));
jest.mock('../../feature/feature.service', () => ({
  clearFeatureCache: jest.fn(),
}));

import * as FeatureEndpointRepository from '../feature-endpoint.repository';
import * as FeatureEndpointService from '../feature-endpoint.service';

describe('FeatureEndpoint Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getFeatureEndpoint', () => {
    it('should return endpoint if it exists', async () => {
      const mock = { _id: 'ep-1', name: 'Generate', value: 'generate' };
      (FeatureEndpointRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await FeatureEndpointService.getFeatureEndpoint('ep-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (FeatureEndpointRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(FeatureEndpointService.getFeatureEndpoint('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found'),
      );
    });
  });

  describe('createFeatureEndpoint', () => {
    it('should create endpoint when value is unique', async () => {
      const payload = { name: 'Generate', value: 'generate', is_active: true } as any;
      const mock = { _id: 'ep-new', ...payload };
      (FeatureEndpointRepository.findOne as jest.Mock).mockResolvedValue(null);
      (FeatureEndpointRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await FeatureEndpointService.createFeatureEndpoint(payload);
      expect(result).toEqual(mock);
    });

    it('should throw 409 on duplicate value', async () => {
      const payload = { name: 'Generate', value: 'generate', is_active: true } as any;
      (FeatureEndpointRepository.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });
      await expect(FeatureEndpointService.createFeatureEndpoint(payload)).rejects.toThrow(
        new AppError(httpStatus.CONFLICT, "Feature endpoint with value 'generate' already exists"),
      );
    });
  });

  describe('deleteFeatureEndpoint', () => {
    it('should soft delete if exists', async () => {
      (FeatureEndpointRepository.findById as jest.Mock).mockResolvedValue({ _id: 'ep-1' });
      (FeatureEndpointRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await FeatureEndpointService.deleteFeatureEndpoint('ep-1');
      expect(FeatureEndpointRepository.softDeleteById).toHaveBeenCalledWith('ep-1');
    });

    it('should throw 404 if not found', async () => {
      (FeatureEndpointRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(FeatureEndpointService.deleteFeatureEndpoint('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found'),
      );
    });
  });

  describe('restoreFeatureEndpoint', () => {
    it('should restore if found as deleted', async () => {
      const mock = { _id: 'ep-1' };
      (FeatureEndpointRepository.restore as jest.Mock).mockResolvedValue(mock);
      const result = await FeatureEndpointService.restoreFeatureEndpoint('ep-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found or not deleted', async () => {
      (FeatureEndpointRepository.restore as jest.Mock).mockResolvedValue(null);
      await expect(FeatureEndpointService.restoreFeatureEndpoint('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found or not deleted'),
      );
    });
  });
});
