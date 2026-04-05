import AppError from '../../../builder/app-error';
import * as UserRepository from '../user.repository';
import * as UserService from '../user.service';

// Mocking the entire UserRepository
jest.mock('../user.repository');

describe('User Service Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return a user if found', async () => {
      const mockUser = { _id: '1', name: 'John Doe', email: 'john@example.com' };
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUser('1');

      expect(result).toEqual(mockUser);
      expect(UserRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if user not found', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserService.getUser('1')).rejects.toThrow(AppError);
      await expect(UserService.getUser('1')).rejects.toThrow('User not found');
    });
  });

  describe('updateSelf', () => {
    it('should update and return the user', async () => {
      const mockUser = { _id: '1', email: 'old@example.com', token_version: 1 };
      const payload = { name: 'New Name' };
      const mockUpdatedUser = { ...mockUser, ...payload, token_version: 2 };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.updateById as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await UserService.updateSelf({ _id: '1' } as any, payload);

      expect(result).toEqual(mockUpdatedUser);
      expect(UserRepository.updateById).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ ...payload, $inc: { token_version: 1 } })
      );
    });

    it('should throw error if email already exists', async () => {
      const mockUser = { _id: '1', email: 'old@example.com' };
      const payload = { email: 'new@example.com' };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.findByEmail as jest.Mock).mockResolvedValue({ _id: '2', email: 'new@example.com' });

      await expect(UserService.updateSelf({ _id: '1' } as any, payload)).rejects.toThrow(AppError);
      await expect(UserService.updateSelf({ _id: '1' } as any, payload)).rejects.toThrow('Email already exists');
    });
  });

  // More tests can be added for deleteUser, restoreUser, etc.
});
