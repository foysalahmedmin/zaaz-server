import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

// Explicit manual mocks to avoid Mongoose 'parent' field conflict at load time
jest.mock('../feature.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findPaginated: jest.fn(),
  findPaginatedWithLookups: jest.fn(),
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
jest.mock('../../feature-endpoint/feature-endpoint.model', () => ({
  FeatureEndpoint: { collection: { name: 'featureendpoints' } },
}));
jest.mock('../../feature-popup/feature-popup.model', () => ({
  FeaturePopup: { collection: { name: 'featurepopups' } },
}));

import * as FeatureRepository from '../feature.repository';
import * as FeatureService from '../feature.service';

describe('Feature Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getFeature', () => {
    it('should return a feature if it exists', async () => {
      const mock = { _id: 'feat-1', name: 'Writing', value: 'writing' };
      (FeatureRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await FeatureService.getFeature('feat-1');
      expect(result).toEqual(mock);
      expect(FeatureRepository.findById).toHaveBeenCalledWith('feat-1', true);
    });

    it('should throw 404 if not found', async () => {
      (FeatureRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(FeatureService.getFeature('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature not found'),
      );
    });
  });

  describe('createFeature', () => {
    it('should create a feature', async () => {
      const payload = { name: 'Writing', value: 'writing', is_active: true } as any;
      const mock = { _id: 'feat-new', ...payload };
      (FeatureRepository.findOne as jest.Mock).mockResolvedValue(null);
      (FeatureRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await FeatureService.createFeature(payload);
      expect(result).toEqual(mock);
    });

    it('should throw 409 on duplicate value', async () => {
      const payload = { name: 'Writing', value: 'writing', is_active: true } as any;
      (FeatureRepository.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });
      await expect(FeatureService.createFeature(payload)).rejects.toThrow(
        new AppError(httpStatus.CONFLICT, "Feature with value 'writing' already exists"),
      );
    });
  });

  describe('deleteFeature', () => {
    it('should soft delete if exists', async () => {
      (FeatureRepository.findById as jest.Mock).mockResolvedValue({ _id: 'feat-1' });
      (FeatureRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await FeatureService.deleteFeature('feat-1');
      expect(FeatureRepository.softDeleteById).toHaveBeenCalledWith('feat-1');
    });

    it('should throw 404 if not found', async () => {
      (FeatureRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(FeatureService.deleteFeature('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature not found'),
      );
    });
  });

  describe('restoreFeature', () => {
    it('should restore if found as deleted', async () => {
      const mock = { _id: 'feat-1', is_deleted: false };
      (FeatureRepository.restore as jest.Mock).mockResolvedValue(mock);

      const result = await FeatureService.restoreFeature('feat-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found or not deleted', async () => {
      (FeatureRepository.restore as jest.Mock).mockResolvedValue(null);
      await expect(FeatureService.restoreFeature('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature not found or not deleted'),
      );
    });
  });
});
