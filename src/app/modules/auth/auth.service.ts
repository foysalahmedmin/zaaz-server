import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../builder/AppError';
import config from '../../config';
import { TJwtPayload } from '../../types/jsonwebtoken.type';
import { sendEmail } from '../../utils/sendEmail';
import { User } from '../user/user.model';
import {
  TChangePassword,
  TForgetPassword,
  TResetPassword,
  TSignin,
  TSignup,
} from './auth.type';
import { createToken, verifyToken } from './auth.utils';

export const signin = async (payload: TSignin) => {
  const user = await User.isUserExistByEmail(payload.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user?.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }

  if (user?.status == 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  if (!(await bcrypt.compare(payload?.password, user?.password))) {
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not matched!');
  }

  const jwtPayload: TJwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    is_verified: user?.is_verified || false,
    ...(user.image && { image: user.image }),
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_secret_expires_in,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_secret_expires_in,
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    info: jwtPayload,
  };
};

export const signup = async (payload: TSignup) => {
  const isExist = await User.isUserExistByEmail(payload.email);
  if (isExist) {
    throw new AppError(httpStatus.CONFLICT, 'User already exists!');
  }

  const user = await User.create(payload);

  if (!user) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create user!',
    );
  }

  const jwtPayload: TJwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    is_verified: user?.is_verified || false,
    ...(user.image && { image: user.image }),
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_secret_expires_in,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_secret_expires_in,
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    info: jwtPayload,
  };
};

export const refreshToken = async (token: string) => {
  const { email, iat } = verifyToken(token, config.jwt_refresh_secret);

  if (!email || typeof iat !== 'number') {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'You do not have the necessary permissions to access this resource.',
    );
  }

  const user = await User.isUserExistByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user?.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }

  if (user?.status == 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
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

  const jwtPayload: TJwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    is_verified: user?.is_verified || false,
    ...(user.image && { image: user.image }),
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_secret_expires_in,
  );

  return {
    access_token: accessToken,
    info: jwtPayload,
  };
};

export const changePassword = async (
  user: JwtPayload,
  payload: TChangePassword,
) => {
  if (!(await bcrypt.compare(payload?.current_password, user?.password))) {
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not matched!');
  }

  const hashedNewPassword = await bcrypt.hash(
    payload.new_password,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await User.findOneAndUpdate(
    {
      email: user.email,
      role: user.role,
    },
    {
      password: hashedNewPassword,
      password_changed_at: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};

export const forgetPassword = async (payload: TForgetPassword) => {
  const user = await User.isUserExistByEmail(payload.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user?.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }

  if (user?.status == 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  const jwtPayload: TJwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    is_verified: user?.is_verified || false,
    ...(user.image && { image: user.image }),
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_reset_password_secret,
    config.jwt_reset_password_secret_expires_in || '10m',
  );

  const link = `${config.reset_password_ui_link}?id=${user.email}&token=${resetToken}`;
  const content = `<a href="${link}">Click here to reset your password</a>`;

  sendEmail({
    to: user.email,
    subject: 'Password Change Link',
    text: 'Reset your password within 10 minuets',
    html: content,
  });
};

export const resetPassword = async (payload: TResetPassword, token: string) => {
  const decoded = verifyToken(token, config.jwt_reset_password_secret);

  if (!decoded?.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'You do not have the necessary permissions to access this resource.',
    );
  }

  const { email } = decoded;

  const user = await User.isUserExistByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user?.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }

  if (user?.status == 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  const { _id } = user;

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await User.findByIdAndUpdate(
    _id,
    {
      password: hashedPassword,
      password_changed_at: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};

export const emailVerificationSource = async (user: TJwtPayload) => {
  const jwtPayload: TJwtPayload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    is_verified: user?.is_verified || false,
    ...(user.image && { image: user.image }),
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_email_verification_secret,
    config.jwt_email_verification_secret_expires_in || '10m',
  );

  const link = `${config.email_verification_ui_link}?id=${user.email}&token=${resetToken}`;
  const content = `<a href="${link}">Click here to verify your email</a>`;

  sendEmail({
    to: user.email,
    subject: 'Email Verification Link',
    text: 'Verify your email within 10 minuets',
    html: content,
  });
};

export const emailVerification = async (token: string) => {
  const decoded = verifyToken(token, config.jwt_email_verification_secret);

  if (!decoded?.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'You do not have the necessary permissions to access this resource.',
    );
  }

  const { email } = decoded;

  const user = await User.isUserExistByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user?.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }

  if (user?.status == 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  const { _id } = user;

  const result = await User.findByIdAndUpdate(
    _id,
    {
      is_verified: true,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};
