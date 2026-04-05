import * as PlanRepository from '../plan.repository';
import * as PlanService from '../plan.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../plan.repository');

describe('Plan Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlan', () => {
    it('should return a plan if it exists', async () => {
      const mockResult = { _id: 'plan-123', name: 'Starter Plan' };
      (PlanRepository.findById as jest.Mock).mockResolvedValue(mockResult);

      const result = await PlanService.getPlan('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockResult);
      expect(PlanRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw 404 if plan not found', async () => {
      (PlanRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(PlanService.getPlan('507f1f77bcf86cd799439011'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Plan not found'));
    });
  });

  describe('deletePlan', () => {
    it('should soft delete a plan if it exists', async () => {
      (PlanRepository.softDelete as jest.Mock).mockResolvedValue({ _id: 'plan-123', is_deleted: true });

      await PlanService.deletePlan('507f1f77bcf86cd799439011');
      expect(PlanRepository.softDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
