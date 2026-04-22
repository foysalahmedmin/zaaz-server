import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../package-plan.repository', () => ({
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
  PackagePlan: { findById: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }) },
}));
jest.mock('../../plan/plan.model', () => ({
  Plan: { findById: jest.fn().mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn() }) }) },
}));
jest.mock('../../package/package.model', () => ({
  Package: { findById: jest.fn().mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn() }) }) },
}));
jest.mock('../../package/package.service', () => ({
  clearPackageCache: jest.fn().mockResolvedValue(undefined),
}));

import * as PackagePlanRepository from '../package-plan.repository';
import * as PackagePlanService from '../package-plan.service';
import { Plan } from '../../plan/plan.model';
import { Package } from '../../package/package.model';

describe('PackagePlan Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createPackagePlan', () => {
    it('should create package plan when all validations pass', async () => {
      const payload = {
        plan: 'plan-1',
        package: 'pkg-1',
        price: 100,
        credits: 500,
        is_initial: false,
        is_active: true,
      } as any;
      const mock = { _id: 'pp-1', ...payload };

      (Plan.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'plan-1', is_active: true }) }),
      });
      (Package.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'pkg-1', is_active: true }) }),
      });
      (PackagePlanRepository.findOne as jest.Mock).mockResolvedValue(null);
      (PackagePlanRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await PackagePlanService.createPackagePlan(payload);
      expect(result).toEqual(mock);
    });

    it('should throw BAD_REQUEST if plan not found', async () => {
      const payload = { plan: 'plan-bad', package: 'pkg-1', price: 100, credits: 500, is_initial: false, is_active: true } as any;
      (Plan.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });

      await expect(PackagePlanService.createPackagePlan(payload)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Plan not found or is not active'),
      );
    });

    it('should throw BAD_REQUEST if package-plan combination already exists', async () => {
      const payload = { plan: 'plan-1', package: 'pkg-1', price: 100, credits: 500, is_initial: false, is_active: true } as any;
      (Plan.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'plan-1', is_active: true }) }),
      });
      (Package.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'pkg-1', is_active: true }) }),
      });
      (PackagePlanRepository.findOne as jest.Mock).mockResolvedValue({ _id: 'pp-existing' });

      await expect(PackagePlanService.createPackagePlan(payload)).rejects.toThrow(
        new AppError(httpStatus.BAD_REQUEST, 'Package-plan combination already exists'),
      );
    });
  });

  describe('deletePackagePlan', () => {
    it('should soft delete if exists', async () => {
      (PackagePlanRepository.findById as jest.Mock).mockResolvedValue({ _id: 'pp-1' });
      (PackagePlanRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await PackagePlanService.deletePackagePlan('pp-1');
      expect(PackagePlanRepository.softDeleteById).toHaveBeenCalledWith('pp-1', undefined);
    });

    it('should throw 404 if not found', async () => {
      (PackagePlanRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(PackagePlanService.deletePackagePlan('bad-id')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Package-plan not found'),
      );
    });
  });

  describe('getPackagePlansByPackage', () => {
    it('should return package plans for a package', async () => {
      const mock = [{ _id: 'pp-1', is_initial: true }];
      (PackagePlanRepository.findByPackage as jest.Mock).mockResolvedValue(mock);

      const result = await PackagePlanService.getPackagePlansByPackage('pkg-1');
      expect(result).toEqual(mock);
      expect(PackagePlanRepository.findByPackage).toHaveBeenCalledWith('pkg-1', false);
    });
  });
});
