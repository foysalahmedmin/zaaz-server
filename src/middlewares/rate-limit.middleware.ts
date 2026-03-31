import { NextFunction, Request, Response } from 'express';
import {
  RateLimiterMemory,
  RateLimiterRedis,
} from 'rate-limiter-flexible';
import config from '../config/env';
import { cacheClient } from '../config/redis';

/**
 * Skip rate limiting for microservice requests that provide a valid server API key.
 */
const skipServerRequests = (req: Request) => {
  const serverApiKey = req.headers['x-server-api-key'];
  return (
    serverApiKey &&
    serverApiKey === (process.env.SERVER_API_KEY || config.server_api_key)
  );
};

// --- Configuration Helper ---

const createLimiter = (options: {
  keyPrefix: string;
  points: number;
  duration: number; // in seconds
}) => {
  const commonOptions = {
    keyPrefix: options.keyPrefix,
    points: options.points,
    duration: options.duration,
  };

  if (config.redis_enabled && cacheClient) {
    return new RateLimiterRedis({
      storeClient: cacheClient as any,
      ...commonOptions,
    });
  }

  return new RateLimiterMemory(commonOptions);
};

// --- Limiters ---

// Global: 1000 requests per 15 minutes (900 seconds)
const globalLimiter = createLimiter({
  keyPrefix: 'rl_global',
  points: 1000,
  duration: 900,
});

// Auth: 50 requests per 15 minutes (900 seconds)
const authLimiter = createLimiter({
  keyPrefix: 'rl_auth',
  points: 50,
  duration: 900,
});

// --- Middleware Factory ---

const createMiddleware = (
  limiter: RateLimiterRedis | RateLimiterMemory,
  message: string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (skipServerRequests(req)) {
      return next();
    }

    try {
      await limiter.consume(req.ip!);
      next();
    } catch {
      res.status(429).json({
        success: false,
        message,
      });
    }
  };
};

export const globalRateLimiter = createMiddleware(
  globalLimiter,
  'Too many requests from this IP, please try again after 15 minutes',
);

export const authRateLimiter = createMiddleware(
  authLimiter,
  'Too many authentication attempts, please try again after 15 minutes',
);

/**
 * Factory to create custom rate limiters as Express middleware.
 * Maintains a similar API to allow easy migration from express-rate-limit.
 */
export const createCustomRateLimiter = (options: {
  windowMs: number; // in milliseconds
  max: number; // number of requests
  message?: string;
}) => {
  const limiter = createLimiter({
    keyPrefix: `rl_custom_${Math.random().toString(36).substring(7)}`,
    points: options.max,
    duration: Math.ceil(options.windowMs / 1000),
  });

  return createMiddleware(
    limiter,
    options.message || 'Too many requests, please try again later.',
  );
};


