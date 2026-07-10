/**
 * Centralized Rate Limit Configuration
 *
 * Every threshold is driven by environment variables with sensible defaults.
 * Override any value per-environment (dev / staging / prod) via the corresponding
 * RL_* env var — see .env for the full list.
 */

export const rateLimitConfig = {
  /**
   * Tier 1 — Auth Routes (/api/auth/*)
   * Dual-axis: per-IP AND per-account (email) with exponential backoff.
   */
  auth: {
    /** Per-IP sliding window */
    ip: {
      windowMs: Number(process.env.RL_AUTH_IP_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: Number(process.env.RL_AUTH_IP_MAX) || 10,
    },
    /** Per-account (email) failed-attempt tracking */
    account: {
      windowMs: Number(process.env.RL_AUTH_ACCOUNT_WINDOW_MS) || 30 * 60 * 1000, // 30 minutes
      maxFailed: Number(process.env.RL_AUTH_ACCOUNT_MAX_FAILED) || 5,
    },
    /** Exponential backoff after exceeding per-account limit */
    backoff: {
      baseDelayMs: Number(process.env.RL_AUTH_BACKOFF_BASE_MS) || 1000,     // 1 second
      ceilingMs: Number(process.env.RL_AUTH_BACKOFF_CEILING_MS) || 128000,  // 128 seconds
      multiplier: Number(process.env.RL_AUTH_BACKOFF_MULTIPLIER) || 2,
    },
  },

  /**
   * Tier 2 — Public Endpoints (unauthenticated, high-traffic)
   * Per-IP with burst allowance.
   */
  public: {
    windowMs: Number(process.env.RL_PUBLIC_WINDOW_MS) || 60 * 1000, // 1 minute
    max: Number(process.env.RL_PUBLIC_MAX) || 60,
    burst: Number(process.env.RL_PUBLIC_BURST) || 10,               // additional burst allowance
  },

  /**
   * Tier 3 — Authenticated User Actions
   * Per-userId (NOT per-IP), separate window per user.
   */
  authenticated: {
    windowMs: Number(process.env.RL_AUTH_USER_WINDOW_MS) || 60 * 1000, // 1 minute
    max: Number(process.env.RL_AUTH_USER_MAX) || 200,
  },

  /**
   * Global fallback — safety net across all /api/* routes.
   * Intentionally generous; the tier-specific limits do the real work.
   */
  global: {
    windowMs: Number(process.env.RL_GLOBAL_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.RL_GLOBAL_MAX) || 500,
  },
};

export default rateLimitConfig;
