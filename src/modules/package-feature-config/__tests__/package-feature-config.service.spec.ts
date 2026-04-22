import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../package-feature-config.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdRaw: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  updateById: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  updateManyByPackage: jest.fn(),
  bulkWrite: jest.fn(),
}));
jest.mock('../../package/package.model', () => ({
  Package: { findById: jest.fn().mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn() }) }) },
}));
jest.mock('../../feature/feature.model', () => ({
  Feature: { findById: jest.fn().mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn() }) }) },
}));
jest.mock('../../feature-endpoint/feature-endpoint.model', () => ({
  FeatureEndpoint: { findById: jest.fn().mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn() }) }) },
}));
jest.mock('../../../utils/cache.utils', () => ({
  invalidateCacheByPattern: jest.fn().mockResolvedValue(undefined),
  withCache: jest.fn().mockImplementation((_key: any, _ttl: any, fn: any) => fn()),
}));

import * as PackageFeatureConfigRepository from '../package-feature-config.repository';
import * as PackageFeatureConfigService from '../package-feature-config.service';
import { Package } from '../../package/package.model';

describe('PackageFeatureConfig Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getPackageFeatureConfig', () => {
    it('should return config if found', async () => {
      const mock = { _id: 'cfg-1', config: { max_credits: 100 } };
      (PackageFeatureConfigRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await PackageFeatureConfigService.getPackageFeatureConfig('cfg-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (PackageFeatureConfigRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(PackageFeatureConfigService.getPackageFeatureConfig('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package feature config not found'),
      );
    });
  });

  describe('createPackageFeatureConfig', () => {
    it('should throw 404 if package not found', async () => {
      const payload = {
        package: 'pkg-bad',
        config: { max_credits: 100 },
      } as any;
      (Package.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });

      await expect(PackageFeatureConfigService.createPackageFeatureConfig(payload)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package not found'),
      );
    });

    it('should create config when valid', async () => {
      const payload = { package: 'pkg-1', config: { max_credits: 100 } } as any;
      const mock = { _id: 'cfg-1', ...payload };
      (Package.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'pkg-1' }) }),
      });
      (PackageFeatureConfigRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await PackageFeatureConfigService.createPackageFeatureConfig(payload);
      expect(result).toEqual(mock);
    });
  });

  describe('deletePackageFeatureConfig', () => {
    it('should soft delete if found', async () => {
      (PackageFeatureConfigRepository.findByIdRaw as jest.Mock).mockResolvedValue({ _id: 'cfg-1' });
      (PackageFeatureConfigRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await PackageFeatureConfigService.deletePackageFeatureConfig('cfg-1');
      expect(PackageFeatureConfigRepository.softDeleteById).toHaveBeenCalledWith('cfg-1', undefined);
    });

    it('should throw 404 if not found', async () => {
      (PackageFeatureConfigRepository.findByIdRaw as jest.Mock).mockResolvedValue(null);
      await expect(PackageFeatureConfigService.deletePackageFeatureConfig('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package feature config not found'),
      );
    });
  });
});
