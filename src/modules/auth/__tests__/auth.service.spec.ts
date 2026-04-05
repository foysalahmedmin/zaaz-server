import * as AuthRepository from '../auth.repository';
import * as AuthServices from '../auth.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';
import bcrypt from 'bcrypt';

jest.mock('../auth.repository');
jest.mock('bcrypt');

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signin', () => {
    it('should return tokens if credentials are valid', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'user',
        token_version: 1,
        auth_source: 'email',
        is_deleted: false,
        status: 'active'
      };

      (AuthRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthServices.signin({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.info.email).toBe(mockUser.email);
    });

    it('should throw 403 if password does not match', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        is_deleted: false,
        status: 'active'
      };

      (AuthRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthServices.signin({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow(new AppError(httpStatus.FORBIDDEN, 'Password do not matched!'));
    });
  });

  describe('signup', () => {
    it('should create a user and return tokens', async () => {
      (AuthRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      const newUser = {
        _id: 'new-user-id',
        name: 'New User',
        email: 'new@example.com',
        role: 'user',
        token_version: 1,
        auth_source: 'email'
      };
      (AuthRepository.createUser as jest.Mock).mockResolvedValue(newUser);

      const result = await AuthServices.signup({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      });

      expect(result).toHaveProperty('access_token');
      expect(AuthRepository.createUser).toHaveBeenCalled();
    });
  });
});
