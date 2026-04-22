jest.mock('../package-feature.repository', () => ({
  create: jest.fn(),
  findByPackage: jest.fn(),
  findRawByPackage: jest.fn(),
  updateMany: jest.fn(),
  deleteByPackage: jest.fn(),
}));

import * as PackageFeatureRepository from '../package-feature.repository';
import * as PackageFeatureService from '../package-feature.service';

describe('PackageFeature Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getPackageFeaturesByPackage', () => {
    it('should return features for a package', async () => {
      const mock = [{ _id: 'pf-1', feature: 'feat-1', is_active: true }];
      (PackageFeatureRepository.findByPackage as jest.Mock).mockResolvedValue(mock);

      const result = await PackageFeatureService.getPackageFeaturesByPackage('pkg-1');
      expect(result).toEqual(mock);
      expect(PackageFeatureRepository.findByPackage).toHaveBeenCalledWith('pkg-1', false);
    });

    it('should populate features when populate=true', async () => {
      const mock = [{ _id: 'pf-1', feature: { name: 'AI', value: 'ai' }, is_active: true }];
      (PackageFeatureRepository.findByPackage as jest.Mock).mockResolvedValue(mock);

      const result = await PackageFeatureService.getPackageFeaturesByPackage('pkg-1', true);
      expect(result).toEqual(mock);
      expect(PackageFeatureRepository.findByPackage).toHaveBeenCalledWith('pkg-1', true);
    });
  });

  describe('deletePackageFeaturesByPackage', () => {
    it('should soft delete all features for a package', async () => {
      (PackageFeatureRepository.deleteByPackage as jest.Mock).mockResolvedValue(undefined);

      await PackageFeatureService.deletePackageFeaturesByPackage('pkg-1');
      expect(PackageFeatureRepository.deleteByPackage).toHaveBeenCalledWith('pkg-1', undefined);
    });
  });

  describe('updatePackageFeatures', () => {
    it('should add new features and remove old ones', async () => {
      const existingDocs = [
        { feature: { toString: () => 'feat-existing' } },
      ];
      (PackageFeatureRepository.findRawByPackage as jest.Mock).mockResolvedValue(existingDocs);
      (PackageFeatureRepository.updateMany as jest.Mock).mockResolvedValue(undefined);
      (PackageFeatureRepository.create as jest.Mock).mockResolvedValue([]);

      await PackageFeatureService.updatePackageFeatures('507f1f77bcf86cd799439011', ['507f1f77bcf86cd799439022']);

      expect(PackageFeatureRepository.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ feature: { $in: ['feat-existing'] } }),
        { is_deleted: true, is_active: false },
        undefined,
      );
      expect(PackageFeatureRepository.create).toHaveBeenCalled();
    });
  });
});
