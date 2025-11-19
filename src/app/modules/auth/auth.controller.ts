import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as AuthServices from './auth.service';

const COOKIE_NAME = 'refresh_token';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365;

export const signin = catchAsync(async (req, res) => {
  const { refresh_token, access_token, info } = await AuthServices.signin(
    req.body,
  );

  res.cookie(COOKIE_NAME, refresh_token, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User is singed in successfully!',
    data: {
      token: access_token,
      info: info,
    },
  });
});

export const signup = catchAsync(async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const image = files.image?.[0]?.filename || '';
  const payload = {
    ...req.body,
    role: 'user',
    image,
  };
  const { refresh_token, access_token, info } =
    await AuthServices.signup(payload);

  res.cookie(COOKIE_NAME, refresh_token, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'User is singed in successfully!',
    data: {
      token: access_token,
      info: info,
    },
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const { refresh_token } = req.cookies;
  const { access_token, info } = await AuthServices.refreshToken(refresh_token);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Access token is retrieved successfully!',
    data: {
      token: access_token,
      info: info,
    },
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const result = await AuthServices.changePassword(req.user, req.body);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Password is changed successfully!',
    data: result,
  });
});

export const forgetPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.forgetPassword(req.body);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Password reset link is sent successfully! Check your email.',
    data: result,
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization || '';
  const result = await AuthServices.resetPassword(req.body, token);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Password is reset successfully!',
    data: result,
  });
});

export const emailVerificationSource = catchAsync(async (req, res) => {
  const result = await AuthServices.emailVerificationSource(req.user);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Email verification link is sent successfully! Check your email.',
    data: result,
  });
});

export const emailVerification = catchAsync(async (req, res) => {
  const token = req.headers.authorization || '';
  const result = await AuthServices.emailVerification(token);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Email is verified successfully!',
    data: result,
  });
});
