import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../builder/AppError';
import config from '../config';
import catchAsync from '../utils/catchAsync';

const serverAuth = () => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      // Get server API key from header
      const serverApiKey = req.headers['x-server-api-key'] as string;
      const expectedApiKey =
        process.env.SERVER_API_KEY || config.server_api_key;

      if (!expectedApiKey) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Server API key not configured',
        );
      }

      if (!serverApiKey) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Server API key is required',
        );
      }

      if (serverApiKey !== expectedApiKey) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid server API key');
      }

      next();
    },
  );
};

export default serverAuth;
