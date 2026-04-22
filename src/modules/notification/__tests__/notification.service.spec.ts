import * as NotificationRepository from '../notification.repository';
import * as NotificationService from '../notification.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../notification.repository');
jest.mock('../../../config/socket', () => ({ emitToUser: jest.fn() }));
jest.mock('../../notification-recipient/notification-recipient.model', () => ({
  NotificationRecipient: { create: jest.fn(), findById: jest.fn() },
}));
jest.mock('../../user/user.model', () => ({
  User: { findOne: jest.fn(), find: jest.fn() },
}));

describe('Notification Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotification', () => {
    it('should return a notification if it exists', async () => {
      const mock = { _id: 'notif-1', title: 'Test', message: 'Hello' };
      (NotificationRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await NotificationService.getNotification('notif-1');

      expect(result).toEqual(mock);
      expect(NotificationRepository.findById).toHaveBeenCalledWith('notif-1');
    });

    it('should throw 404 if not found', async () => {
      (NotificationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(NotificationService.getNotification('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Notification not found'));
    });
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const payload = { title: 'Hello', message: 'World', type: 'request', channels: ['web'] } as any;
      const mock = { _id: 'notif-new', ...payload };
      (NotificationRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await NotificationService.createNotification(payload);

      expect(result).toEqual(mock);
    });
  });

  describe('updateNotification', () => {
    it('should update if notification exists', async () => {
      const existing = { _id: 'notif-1', title: 'Old' };
      const updated = { _id: 'notif-1', title: 'New' };
      (NotificationRepository.findById as jest.Mock).mockResolvedValue(existing);
      (NotificationRepository.updateById as jest.Mock).mockResolvedValue(updated);

      const result = await NotificationService.updateNotification('notif-1', { title: 'New' });

      expect(result).toEqual(updated);
    });

    it('should throw 404 if not found', async () => {
      (NotificationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(NotificationService.updateNotification('bad-id', {}))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Notification not found'));
    });
  });

  describe('deleteNotification', () => {
    it('should soft delete if exists', async () => {
      const existing = { _id: 'notif-1' };
      (NotificationRepository.findById as jest.Mock).mockResolvedValue(existing);
      (NotificationRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await NotificationService.deleteNotification('notif-1');

      expect(NotificationRepository.softDeleteById).toHaveBeenCalledWith('notif-1');
    });

    it('should throw 404 if not found', async () => {
      (NotificationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(NotificationService.deleteNotification('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Notification not found'));
    });
  });

  describe('restoreNotification', () => {
    it('should restore if found as deleted', async () => {
      const mock = { _id: 'notif-1', is_deleted: false };
      (NotificationRepository.restore as jest.Mock).mockResolvedValue(mock);

      const result = await NotificationService.restoreNotification('notif-1');

      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found or not deleted', async () => {
      (NotificationRepository.restore as jest.Mock).mockResolvedValue(null);

      await expect(NotificationService.restoreNotification('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Notification not found or not deleted'));
    });
  });
});
