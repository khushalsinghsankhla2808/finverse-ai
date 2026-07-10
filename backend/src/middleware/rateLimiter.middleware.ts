/**
 * Rate Limiter Middleware
 *
 * Three tiers of rate limiting + a global safety net:
 *
 * 1. Auth (Tier 1): Dual-axis per-IP AND per-account with exponential backoff
 * 2. Public (Tier 2): Per-IP with burst allowance
 * 3. Authenticated (Tier 3): Per-userId (NOT per-IP)
 * 4. Global: Generous safety net across all /api/* routes
 *
 * All thresholds are sourced from config/rateLimits.ts (ENV-driven).
 * Violations are logged via Winston with IP, userId, route, and timestamp.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '../config/rateLimits';
import { RedisStore } from './rateLimitStore';
import { logger } from './logger.middleware';
import redis from '../config/redis';
import type { AuthenticatedRequest } from './auth.middleware';

// ─── Violation Logger ──────────────────────────────────────────────

const logRateLimitViolation = (
  req: Request,
  tier: string,
  extra?: Record<string, any>
) => {
  const userId = (req as AuthenticatedRequest).user?.id || undefined;
  const email = req.body?.email || undefined;

  logger.warn({
    event: 'rate_limit_exceeded',
    tier,
    ip: req.ip || req.socket.remoteAddress,
    userId,
    email,
    route: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ...extra,
  });
};

// ─── Standard 429 Response Builder ─────────────────────────────────

const buildRateLimitResponse = (retryAfterSeconds: number) => ({
  success: false,
  message: 'Too many requests. Please try again later.',
  retryAfter: retryAfterSeconds,
});

// ─── Tier 1a: Auth Per-IP Limiter ──────────────────────────────────

export const authIpLimiter = rateLimit({
  windowMs: rateLimitConfig.auth.ip.windowMs,
  max: rateLimitConfig.auth.ip.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(),
  keyGenerator: (req: Request) => `auth-ip:${req.ip}`,
  handler: (req: Request, res: Response) => {
    logRateLimitViolation(req, 'auth-ip');
    const retryAfter = Math.ceil(rateLimitConfig.auth.ip.windowMs / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json(buildRateLimitResponse(retryAfter));
  },
});

// ─── Tier 1b: Auth Per-Account Limiter with Exponential Backoff ────

const AUTH_FAIL_KEY_PREFIX = 'rl:auth:fail:';

/**
 * Custom middleware (not express-rate-limit) because we need:
 * - To track failed vs successful attempts separately
 * - Exponential backoff with configurable ceiling
 * - Per-account (email) keying extracted from request body
 *
 * The middleware hooks into res.on('finish') to detect whether
 * the auth attempt succeeded or failed, then updates counters.
 */
export const authAccountLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const email = req.body?.email?.toLowerCase?.();
  if (!email) {
    // No email in body (e.g., /refresh, /logout, /me) — skip per-account limiting
    return next();
  }

  const key = `${AUTH_FAIL_KEY_PREFIX}${email}`;
  const config = rateLimitConfig.auth.account;
  const backoff = rateLimitConfig.auth.backoff;

  try {
    const existing = await redis.get(key);

    if (existing) {
      const data = JSON.parse(existing) as { failCount: number; lastFailedAt: number };

      if (data.failCount >= config.maxFailed) {
        // Calculate exponential backoff
        const exponent = data.failCount - config.maxFailed;
        const delay = Math.min(
          backoff.baseDelayMs * Math.pow(backoff.multiplier, exponent),
          backoff.ceilingMs
        );
        const timeSinceLastFail = Date.now() - data.lastFailedAt;

        if (timeSinceLastFail < delay) {
          // Still within backoff window — reject
          const retryAfterMs = delay - timeSinceLastFail;
          const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

          logRateLimitViolation(req, 'auth-account', {
            email,
            failCount: data.failCount,
            backoffMs: delay,
            retryAfterSeconds,
          });

          res.set('Retry-After', String(retryAfterSeconds));
          return res.status(429).json(buildRateLimitResponse(retryAfterSeconds));
        }
        // Backoff expired — allow the request through
      }
    }

    // Hook into response completion to update counters
    res.on('finish', async () => {
      try {
        const statusCode = res.statusCode;

        if (statusCode === 401 || statusCode === 400) {
          // Failed attempt — increment counter
          const existing = await redis.get(key);
          const data = existing
            ? (JSON.parse(existing) as { failCount: number; lastFailedAt: number })
            : { failCount: 0, lastFailedAt: 0 };

          data.failCount += 1;
          data.lastFailedAt = Date.now();

          const ttlSeconds = Math.ceil(config.windowMs / 1000);
          await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
        } else if (statusCode >= 200 && statusCode < 300) {
          // Successful attempt — reset counter
          await redis.del(key);
        }
      } catch {
        // Fail silently to avoid interrupting the response
      }
    });

    next();
  } catch {
    // If Redis/memory store fails, allow request through (fail-open)
    next();
  }
};

// ─── Tier 2: Public Endpoint Limiter ───────────────────────────────

export const publicLimiter = rateLimit({
  windowMs: rateLimitConfig.public.windowMs,
  max: rateLimitConfig.public.max + rateLimitConfig.public.burst, // base + burst allowance
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(),
  keyGenerator: (req: Request) => `public:${req.ip}`,
  handler: (req: Request, res: Response) => {
    logRateLimitViolation(req, 'public');
    const retryAfter = Math.ceil(rateLimitConfig.public.windowMs / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json(buildRateLimitResponse(retryAfter));
  },
});

// ─── Tier 3: Authenticated User Action Limiter ─────────────────────

export const authenticatedLimiter = rateLimit({
  windowMs: rateLimitConfig.authenticated.windowMs,
  max: rateLimitConfig.authenticated.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(),
  keyGenerator: (req: Request) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    return `user:${userId || req.ip}`;
  },
  handler: (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    logRateLimitViolation(req, 'authenticated', { userId });
    const retryAfter = Math.ceil(rateLimitConfig.authenticated.windowMs / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json(buildRateLimitResponse(retryAfter));
  },
});

// ─── Global Safety Net ─────────────────────────────────────────────

export const globalLimiter = rateLimit({
  windowMs: rateLimitConfig.global.windowMs,
  max: rateLimitConfig.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(),
  handler: (req: Request, res: Response) => {
    logRateLimitViolation(req, 'global');
    const retryAfter = Math.ceil(rateLimitConfig.global.windowMs / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json(buildRateLimitResponse(retryAfter));
  },
});

export default {
  authIpLimiter,
  authAccountLimiter,
  publicLimiter,
  authenticatedLimiter,
  globalLimiter,
};
