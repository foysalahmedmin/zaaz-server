import rateLimit from 'express-rate-limit';
import config from '../config';

export const rateLimiter = rateLimit;

/**
 * Skip rate limiting for microservice requests that provide a valid server API key.
 */
const skipServerRequests = (req: any) => {
  const serverApiKey = req.headers['x-server-api-key'];
  return (
    serverApiKey &&
    serverApiKey === (process.env.SERVER_API_KEY || config.server_api_key)
  );
};

// Global rate limiter for all API requests
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipServerRequests,
  message: {
    success: false,
    message:
      'Too many requests from this IP, please try again after 15 minutes',
  },
  validate: { trustProxy: false },
});

// Stricter rate limiter for authentication routes (login, register, forgot password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (login/signup are more sensitive)
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipServerRequests,
  message: {
    success: false,
    message:
      'Too many authentication attempts, please try again after 15 minutes',
  },
  validate: { trustProxy: false },
});
