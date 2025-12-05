// src/middlewares/auth.ts
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../builder/app-error';
import config from '../config';
import { cacheClient } from '../redis';
import { TJwtPayload, TRole } from '../types/jsonwebtoken.type';
import catchAsync from '../utils/catch-async';

const DEFAULT_ROLE = 'user';

const getUser = async (_id: string) => {
  const redisKey = `auth:user:${_id}`;
  const User = mongoose.connection.collection('users');

  if (!config.redis_enabled)
    return await User.findOne({ _id: new mongoose.Types.ObjectId(_id) });

  try {
    const cachedUser = await cacheClient.get(redisKey);
    if (cachedUser) return JSON.parse(cachedUser.toString());

    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) });
    if (user) {
      try {
        await cacheClient.set(redisKey, JSON.stringify(user), { EX: 30 * 60 });
      } catch (err) {
        console.warn('Redis set failed:', err);
      }
    }
    return user;
  } catch (err) {
    console.warn('Redis get failed, falling back to DB:', err);
    return await User.findOne({ _id: new mongoose.Types.ObjectId(_id) });
  }
};

const auth = (...roles: (TRole | 'guest')[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const authorization = req.headers.authorization;
      const token = authorization?.split(' ')?.[1];

      if (roles.includes('guest') && !token) {
        return next();
      }

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'No token provided.');
      }

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(
          token,
          config.jwt_access_secret as string,
        ) as JwtPayload;
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          throw new AppError(httpStatus.UNAUTHORIZED, 'Token expired');
        }
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
      }

      const { _id, role = DEFAULT_ROLE, iat } = decoded;

      if (!_id || !(role || DEFAULT_ROLE) || typeof iat !== 'number') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token.');
      }

      let user = decoded;

      if (role === 'admin' || role === 'super-admin') {
        user = await getUser(_id);
      }

      if (user?.is_deleted) {
        throw new AppError(httpStatus.FORBIDDEN, 'User is deleted');
      }

      if (user?.status === 'blocked') {
        throw new AppError(httpStatus.FORBIDDEN, 'User is blocked');
      }

      if (user?.password_changed_at) {
        const passwordChangedAt = new Date(user.password_changed_at).getTime();
        const tokenIssuedAt = iat * 1000; // convert seconds → ms

        if (passwordChangedAt > tokenIssuedAt) {
          throw new AppError(
            httpStatus.FORBIDDEN,
            'Password recently changed. Please login again.',
          );
        }
      }

      if (
        !roles.includes(role || DEFAULT_ROLE) ||
        !roles.includes(user?.role || DEFAULT_ROLE)
      ) {
        throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
      }

      req.user = decoded as JwtPayload & TJwtPayload;
      next();
    },
  );
};

export default auth;
