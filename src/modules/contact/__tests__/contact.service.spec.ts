import * as ContactRepository from '../contact.repository';
import * as ContactService from '../contact.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../contact.repository');
jest.mock('../../../config/env', () => ({ email: 'admin@test.com' }));
jest.mock('../../../utils/send-email', () => ({ sendEmail: jest.fn() }));

describe('Contact Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContact', () => {
    it('should create a contact', async () => {
      const payload = { name: 'John', email: 'john@test.com', subject: 'Hi', message: 'Hello' };
      const mock = { _id: 'contact-1', ...payload };
      (ContactRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await ContactService.createContact(payload);

      expect(result).toEqual(mock);
      expect(ContactRepository.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('getContact', () => {
    it('should return a contact if it exists', async () => {
      const mock = { _id: 'contact-1', name: 'John' };
      (ContactRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await ContactService.getContact('contact-1');

      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (ContactRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(ContactService.getContact('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Contact not found'));
    });
  });

  describe('deleteContact', () => {
    it('should soft delete if exists', async () => {
      const existing = { _id: 'contact-1', name: 'John' };
      (ContactRepository.findById as jest.Mock).mockResolvedValue(existing);
      (ContactRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await ContactService.deleteContact('contact-1');

      expect(ContactRepository.softDeleteById).toHaveBeenCalledWith('contact-1');
    });

    it('should throw 404 if not found', async () => {
      (ContactRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(ContactService.deleteContact('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Contact not found'));
    });
  });

  describe('restoreContact', () => {
    it('should restore if found as deleted', async () => {
      const mock = { _id: 'contact-1', is_deleted: false };
      (ContactRepository.restore as jest.Mock).mockResolvedValue(mock);

      const result = await ContactService.restoreContact('contact-1');

      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found or not deleted', async () => {
      (ContactRepository.restore as jest.Mock).mockResolvedValue(null);

      await expect(ContactService.restoreContact('bad-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'Contact not found or not deleted'));
    });
  });
});
