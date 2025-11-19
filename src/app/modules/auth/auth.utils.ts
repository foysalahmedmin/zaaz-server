import httpStatus from 'http-status';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import AppError from '../../builder/AppError';
import { ExpiresIn } from '../../config';
import { TJwtPayload } from './auth.type';

export const createToken = (
  jwtPayload: Partial<TJwtPayload>,
  secret: string,
  expiresIn: ExpiresIn | number,
) => {
  return jwt.sign(jwtPayload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Token expired');
    }
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }
};
