import * as FeatureFeedbackRepository from '../feature-feedback.repository';
import * as FeatureFeedbackService from '../feature-feedback.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../feature-feedback.repository');
jest.mock('../../feature/feature.model', () => ({
  Feature: { findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ name: 'Test Feature' }) }) },
}));
jest.mock('../../notification/notification.service', () => ({
  notifyAdmins: jest.fn(),
}));

describe('FeatureFeedback Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeatureFeedback', () => {
    it('should create feedback and notify admins', async () => {
      const payload = {
        user: 'user-1',
        feature: 'feature-1',
        rating: 5,
        comment: 'Great!',
        category: 'compliment',
        status: 'pending',
        is_deleted: false,
      } as any;
      const mock = { _id: 'feedback-1', ...payload };
      (FeatureFeedbackRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await FeatureFeedbackService.createFeatureFeedback(payload);

      expect(result).toEqual(mock);
      expect(FeatureFeedbackRepository.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateFeatureFeedback', () => {
    it('should update feedback if it exists', async () => {
      const updated = { _id: 'feedback-1', status: 'reviewed' };
      (FeatureFeedbackRepository.updateById as jest.Mock).mockResolvedValue(updated);

      const result = await FeatureFeedbackService.updateFeatureFeedback('feedback-1', { status: 'reviewed' } as any);

      expect(result).toEqual(updated);
    });

    it('should throw 404 if not found', async () => {
      (FeatureFeedbackRepository.updateById as jest.Mock).mockResolvedValue(null);

      await expect(FeatureFeedbackService.updateFeatureFeedback('bad-id', {} as any))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Feedback not found'));
    });
  });

  describe('deleteFeatureFeedback', () => {
    it('should soft delete if exists', async () => {
      const existing = { _id: 'feedback-1' };
      (FeatureFeedbackRepository.findById as jest.Mock).mockResolvedValue(existing);
      (FeatureFeedbackRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await FeatureFeedbackService.deleteFeatureFeedback('feedback-1');

      expect(FeatureFeedbackRepository.softDeleteById).toHaveBeenCalledWith('feedback-1');
    });

    it('should throw 404 if not found', async () => {
      (FeatureFeedbackRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(FeatureFeedbackService.deleteFeatureFeedback('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Feedback not found'));
    });
  });
});
