import * as PackageRepository from '../package.repository';
import * as PackageService from '../package.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../package.repository');

describe('Package Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPackage', () => {
    it('should return a package with populated data', async () => {
      const mockResult = { _id: 'pkg-123', name: 'Starter', prices: [], features: [] };
      const mockAggregate = jest.fn().mockResolvedValue([mockResult]);
      (PackageRepository.Package.aggregate as jest.Mock) = mockAggregate;

      const result = await PackageService.getPackage('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockResult);
    });

    it('should throw 404 if package not found', async () => {
      const mockAggregate = jest.fn().mockResolvedValue([]);
      (PackageRepository.Package.aggregate as jest.Mock) = mockAggregate;

      await expect(PackageService.getPackage('507f1f77bcf86cd799439011'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Package not found'));
    });
  });
});
