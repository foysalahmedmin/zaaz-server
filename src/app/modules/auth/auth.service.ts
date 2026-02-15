import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
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
  TGoogleSignin,
  TResetPassword,
  TSignin,
  TSignup,
} from './auth.type';
import { createToken, verifyToken } from './auth.utils';

const client = new OAuth2Client(config.google_client_id as string);

export const googleSignin = async (payload: TGoogleSignin) => {
  const { id_token } = payload;

  const ticket = await client.verifyIdToken({
    idToken: id_token,
    audience: config.google_client_id as string,
  });

  const googlePayload = ticket.getPayload();

  if (!googlePayload) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid Google token!');
  }

  const {
    email,
    name,
    picture: image,
    sub: google_id,
    email_verified,
  } = googlePayload;

  if (!email) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Email not found in Google!');
  }

  let user = await User.isUserExistByEmail(email);

  if (!user) {
    // Create new user
    user = await User.create({
      name: name || email.split('@')[0],
      email: email,
      image: image,
      role: 'user',
      auth_source: 'google',
      google_id: google_id,
      is_verified: email_verified || false,
      status: 'in-progress',
    });
  } else {
    // Update existing user if needed
    if (user.auth_source === 'email') {
      user.auth_source = 'google';
      user.google_id = google_id;
      if (!user.is_verified) {
        user.is_verified = email_verified || false;
      }
      await user.save();
    }
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
    auth_source: user.auth_source,
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

  if (
    !payload.password ||
    !user.password ||
    !(await bcrypt.compare(payload.password, user.password))
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not matched!');
  }

  const jwtPayload: TJwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    is_verified: user?.is_verified || false,
    auth_source: user.auth_source,
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
    auth_source: user.auth_source,
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
    auth_source: user.auth_source,
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
  userToken: JwtPayload,
  payload: TChangePassword,
) => {
  const user = await User.isUserExist(userToken._id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user.auth_source === 'google') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Google users cannot change password manually.',
    );
  }

  if (
    !(await bcrypt.compare(payload?.current_password, user?.password || ''))
  ) {
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

  if (user.auth_source === 'google') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Google users cannot reset password this way.',
    );
  }

  const jwtPayload: TJwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    is_verified: user?.is_verified || false,
    auth_source: user.auth_source,
    ...(user.image && { image: user.image }),
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_reset_password_secret,
    config.jwt_reset_password_secret_expires_in || '10m',
  );

  const link = `${config.reset_password_ui_link}?id=${user.email}&token=${resetToken}`;
  const content = `<a href="${link}">Click here to reset your password</a>`;

  await sendEmail({
    to: user.email,
    subject: 'Password Change Link',
    text: 'Reset your password within 10 minutes',
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
    auth_source: user.auth_source,
    ...(user.image && { image: user.image }),
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_email_verification_secret,
    config.jwt_email_verification_secret_expires_in || '10m',
  );

  const link = `${config.email_verification_ui_link}?id=${user.email}&token=${resetToken}`;
  const content = `<a href="${link}">Click here to verify your email</a>`;

  await sendEmail({
    to: user.email,
    subject: 'Email Verification Link',
    text: 'Verify your email within 10 minutes',
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
