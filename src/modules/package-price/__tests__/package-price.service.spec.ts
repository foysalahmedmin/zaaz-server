import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../package-price.repository', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  findByPackage: jest.fn(),
  findPaginated: jest.fn(),
  updateById: jest.fn(),
  updateMany: jest.fn(),
  softDeleteById: jest.fn(),
  softDeleteByPackage: jest.fn(),
  restoreByPackage: jest.fn(),
  PackagePrice: {
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
    }),
  },
}));
jest.mock('../../interval/interval.model', () => ({
  Interval: {
    findById: jest.fn().mockReturnValue({
      session: jest.fn().mockReturnValue({ lean: jest.fn() }),
    }),
  },
}));
jest.mock('../../package/package.model', () => ({
  Package: {
    findById: jest.fn().mockReturnValue({
      session: jest.fn().mockReturnValue({ lean: jest.fn() }),
    }),
  },
}));
jest.mock('../../package/package.service', () => ({
  clearPackageCache: jest.fn().mockResolvedValue(undefined),
}));

import * as PackagePriceRepository from '../package-price.repository';
import * as PackagePriceService from '../package-price.service';
import { Interval } from '../../interval/interval.model';
import { Package } from '../../package/package.model';

describe('PackagePrice Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createPackagePrice', () => {
    it('should create package-price when all validations pass', async () => {
      const payload = {
        interval: 'interval-1',
        package: 'pkg-1',
        price: 100,
        credits: 500,
        is_initial: false,
        is_active: true,
      } as any;
      const mock = { _id: 'pp-1', ...payload };

      (Interval.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: 'interval-1', is_active: true }),
        }),
      });
      (Package.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: 'pkg-1', is_active: true }),
        }),
      });
      (PackagePriceRepository.findOne as jest.Mock).mockResolvedValue(null);
      (PackagePriceRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await PackagePriceService.createPackagePrice(payload);
      expect(result).toEqual(mock);
    });

    it('should throw BAD_REQUEST if interval not found', async () => {
      const payload = {
        interval: 'bad-interval',
        package: 'pkg-1',
        price: 100,
        credits: 500,
        is_initial: false,
        is_active: true,
      } as any;
      (Interval.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });

      await expect(PackagePriceService.createPackagePrice(payload)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Interval not found or is not active'),
      );
    });

    it('should throw BAD_REQUEST if package-price combination already exists', async () => {
      const payload = {
        interval: 'interval-1',
        package: 'pkg-1',
        price: 100,
        credits: 500,
        is_initial: false,
        is_active: true,
      } as any;
      (Interval.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: 'interval-1', is_active: true }),
        }),
      });
      (Package.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: 'pkg-1', is_active: true }),
        }),
      });
      (PackagePriceRepository.findOne as jest.Mock).mockResolvedValue({ _id: 'pp-existing' });

      await expect(PackagePriceService.createPackagePrice(payload)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Package-price combination already exists'),
      );
    });
  });

  describe('deletePackagePrice', () => {
    it('should soft delete if exists', async () => {
      (PackagePriceRepository.findById as jest.Mock).mockResolvedValue({ _id: 'pp-1' });
      (PackagePriceRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await PackagePriceService.deletePackagePrice('pp-1');
      expect(PackagePriceRepository.softDeleteById).toHaveBeenCalledWith('pp-1', undefined);
    });

    it('should throw 404 if not found', async () => {
      (PackagePriceRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(PackagePriceService.deletePackagePrice('bad-id')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package-price not found'),
      );
    });
  });

  describe('getPackagePricesByPackage', () => {
    it('should return package prices for a package', async () => {
      const mock = [{ _id: 'pp-1', is_initial: true }];
      (PackagePriceRepository.findByPackage as jest.Mock).mockResolvedValue(mock);

      const result = await PackagePriceService.getPackagePricesByPackage('pkg-1');
      expect(result).toEqual(mock);
      expect(PackagePriceRepository.findByPackage).toHaveBeenCalledWith('pkg-1', false);
    });
  });
});
