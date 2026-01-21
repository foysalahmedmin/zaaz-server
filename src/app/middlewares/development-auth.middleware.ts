import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../builder/AppError';
import catchAsync from '../utils/catchAsync';

/**
 * Middleware for development/microservice authentication.
 * Similar to serverAuth but dedicated for development/debugging purposes.
 */
const developmentAuth = () => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      // Get development API key from header
      const devApiKey = req.headers['x-development-api-key'] as string;
      const expectedApiKey = process.env.DEVELOPMENT_API_KEY || 'dev_key_00000';

      if (!devApiKey) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Development API key is required in x-development-api-key header',
        );
      }

      if (devApiKey !== expectedApiKey) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Invalid Development API key',
        );
      }

      next();
    },
  );
};

export default developmentAuth;
