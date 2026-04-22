import * as IntervalRepository from '../interval.repository';
import * as IntervalService from '../interval.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../interval.repository');

describe('Interval Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInterval', () => {
    it('should return an interval if it exists', async () => {
      const mockResult = { _id: 'interval-123', name: 'Monthly' };
      (IntervalRepository.findById as jest.Mock).mockResolvedValue(mockResult);

      const result = await IntervalService.getInterval('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockResult);
      expect(IntervalRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw 404 if interval not found', async () => {
      (IntervalRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(IntervalService.getInterval('507f1f77bcf86cd799439011'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Interval not found'));
    });
  });

  describe('deleteInterval', () => {
    it('should soft delete an interval if it exists', async () => {
      (IntervalRepository.softDelete as jest.Mock).mockResolvedValue({ _id: 'interval-123', is_deleted: true });

      await IntervalService.deleteInterval('507f1f77bcf86cd799439011');
      expect(IntervalRepository.softDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
