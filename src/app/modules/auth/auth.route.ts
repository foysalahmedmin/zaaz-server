import express from 'express';
import auth from '../../middlewares/auth.middleware';
import file from '../../middlewares/file.middleware';
import { rateLimiter } from '../../middlewares/rate-limit.middleware';
import validation from '../../middlewares/validation.middleware';
import * as AuthControllers from './auth.controller';
import * as AuthValidations from './auth.validation';

const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

const sensitiveRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many attempts, please try again after 15 minutes',
});

const router = express.Router();

router.post(
  '/signin',
  authRateLimiter,
  sensitiveRateLimiter,
  validation(AuthValidations.signinValidationSchema),
  AuthControllers.signin,
);

router.post(
  '/google-signin',
  authRateLimiter,
  sensitiveRateLimiter,
  validation(AuthValidations.googleSigninValidationSchema),
  AuthControllers.googleSignin,
);

router.post(
  '/signup',
  authRateLimiter,
  sensitiveRateLimiter,
  file({
    name: 'image',
    folder: '/users',
    size: 5_000_000,
    maxCount: 1,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  }),
  validation(AuthValidations.signupValidationSchema),
  AuthControllers.signup,
);

router.post(
  '/refresh-token',
  authRateLimiter,
  validation(AuthValidations.refreshTokenValidationSchema),
  AuthControllers.refreshToken,
);

router.patch(
  '/change-password',
  authRateLimiter,
  auth('admin', 'user'),
  validation(AuthValidations.changePasswordValidationSchema),
  AuthControllers.changePassword,
);

router.post(
  '/forget-password',
  authRateLimiter,
  sensitiveRateLimiter,
  validation(AuthValidations.forgetPasswordValidationSchema),
  AuthControllers.forgetPassword,
);

router.patch(
  '/reset-password',
  authRateLimiter,
  sensitiveRateLimiter,
  validation(AuthValidations.resetPasswordValidationSchema),
  AuthControllers.resetPassword,
);

router.post(
  '/email-verification-source',
  authRateLimiter,
  auth('admin', 'user'),
  AuthControllers.emailVerificationSource,
);

router.post(
  '/email-verification',
  authRateLimiter,
  AuthControllers.emailVerification,
);

const AuthRoutes = router;

export default AuthRoutes;
