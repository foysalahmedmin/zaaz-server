import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../notification-recipient.repository', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  findPaginated: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateMany: jest.fn(),
  softDeleteDoc: jest.fn(),
  permanentDeleteById: jest.fn(),
  permanentDeleteMany: jest.fn(),
  findOneAndRestore: jest.fn(),
  restoreMany: jest.fn(),
  findByAuthorAndIds: jest.fn(),
}));

import * as NotificationRecipientRepository from '../notification-recipient.repository';
import * as NotificationRecipientService from '../notification-recipient.service';

describe('NotificationRecipient Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getNotificationRecipient', () => {
    it('should return recipient if found', async () => {
      const mock = { _id: 'nr-1', is_read: false };
      (NotificationRecipientRepository.findById as jest.Mock).mockResolvedValue(mock);
      const result = await NotificationRecipientService.getNotificationRecipient('nr-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (NotificationRecipientRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(NotificationRecipientService.getNotificationRecipient('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found'),
      );
    });
  });

  describe('deleteNotificationRecipient', () => {
    it('should soft delete if found', async () => {
      (NotificationRecipientRepository.findById as jest.Mock).mockResolvedValue({ _id: 'nr-1' });
      (NotificationRecipientRepository.softDeleteDoc as jest.Mock).mockResolvedValue(undefined);
      await NotificationRecipientService.deleteNotificationRecipient('nr-1');
      expect(NotificationRecipientRepository.softDeleteDoc).toHaveBeenCalledWith({ _id: 'nr-1' });
    });

    it('should throw 404 if not found', async () => {
      (NotificationRecipientRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(NotificationRecipientService.deleteNotificationRecipient('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Notification recipient not found'),
      );
    });
  });

  describe('readAllNotificationRecipients', () => {
    it('should mark all as read for a user', async () => {
      (NotificationRecipientRepository.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });
      const result = await NotificationRecipientService.readAllNotificationRecipients({
        _id: 'user-1',
      } as any);
      expect(result.count).toBe(5);
    });
  });
});
