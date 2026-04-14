import type { Request, Response, NextFunction } from "express";
import { getRedisClient } from "../config/redis.js";
import logger from "../utils/logger.js";
import { getClientIp } from "../utils/request.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const WINDOW_SECONDS = Math.max(1, Math.ceil(WINDOW_MS / 1000));
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 1200);

const AUTH_RATE_LIMIT_WINDOW_MS = Number(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS || WINDOW_MS,
);
const AUTH_RATE_LIMIT_WINDOW_SECONDS = Math.max(
  1,
  Math.ceil(AUTH_RATE_LIMIT_WINDOW_MS / 1000),
);

const REDIS_RETRY_COOLDOWN_MS = Number(
  process.env.RATE_LIMIT_REDIS_RETRY_COOLDOWN_MS || 60_000,
);
const REDIS_DNS_RETRY_COOLDOWN_MS = Number(
  process.env.RATE_LIMIT_REDIS_DNS_RETRY_COOLDOWN_MS || 600_000,
);

const LOGIN_MAX_REQUESTS = Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX || 10);
const FORGOT_PASSWORD_MAX_REQUESTS = Number(
  process.env.AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX || 5,
);
const RESEND_VERIFICATION_MAX_REQUESTS = Number(
  process.env.AUTH_RESEND_VERIFICATION_RATE_LIMIT_MAX || 5,
);
const RESET_PASSWORD_MAX_REQUESTS = Number(
  process.env.AUTH_RESET_PASSWORD_RATE_LIMIT_MAX || 10,
);

/** Maximum entries in the local fallback Map to prevent unbounded growth. */
const LOCAL_MAP_MAX_SIZE = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimitRule {
  key: string;
  maxRequests: number;
  windowMs: number;
  windowSeconds: number;
  match?: (path: string) => boolean;
}

interface LocalHitEntry {
  count: number;
  resetAt: number;
}

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

const AUTH_RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    key: "auth-login",
    maxRequests: LOGIN_MAX_REQUESTS,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    windowSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS,
    match: (path) =>
      path === "/api/auth/login" ||
      path === "/api/auth/sign-in/email" ||
      path === "/api/auth/sign-in/username",
  },
  {
    key: "auth-forgot-password",
    maxRequests: FORGOT_PASSWORD_MAX_REQUESTS,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    windowSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS,
    match: (path) => path === "/api/custom/forgot-password",
  },
  {
    key: "auth-resend-verification",
    maxRequests: RESEND_VERIFICATION_MAX_REQUESTS,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    windowSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS,
    match: (path) => path === "/api/resend-verification",
  },
  {
    key: "auth-reset-password",
    maxRequests: RESET_PASSWORD_MAX_REQUESTS,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    windowSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS,
    match: (path) => path === "/api/custom/reset-password",
  },
];

const GLOBAL_RATE_LIMIT_RULE: RateLimitRule = {
  key: "global",
  maxRequests: MAX_REQUESTS,
  windowMs: WINDOW_MS,
  windowSeconds: WINDOW_SECONDS,
};

const getRateLimitRule = (path: string): RateLimitRule =>
  AUTH_RATE_LIMIT_RULES.find((rule) => rule.match?.(path)) || GLOBAL_RATE_LIMIT_RULE;

// ---------------------------------------------------------------------------
// Bypass detection
// ---------------------------------------------------------------------------

const shouldBypassRateLimit = (req: Request): boolean => {
  if (req.method === "OPTIONS") return true;
  if (req.path?.startsWith("/uploads/")) return true;
  if (req.path === "/health" || req.path === "/ready") return true;
  return false;
};

// ---------------------------------------------------------------------------
// Response headers
// ---------------------------------------------------------------------------

const setRateLimitHeaders = (
  res: Response,
  limit: number,
  remaining: number,
  retryAfterSeconds: number,
): void => {
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining));
  if (retryAfterSeconds > 0) {
    res.setHeader("Retry-After", retryAfterSeconds);
  }
};

// ---------------------------------------------------------------------------
// Local (in-memory) fallback limiter
// ---------------------------------------------------------------------------

const localHits = new Map<string, LocalHitEntry>();

// Periodic cleanup — runs at the shorter of the two window intervals
// to ensure entries from all rule windows get cleaned up promptly.
const CLEANUP_INTERVAL_MS = Math.min(WINDOW_MS, AUTH_RATE_LIMIT_WINDOW_MS, 60_000);

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of localHits) {
    if (now >= entry.resetAt) {
      localHits.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

const applyLocalLimit = (
  req: Request,
  res: Response,
  next: NextFunction,
  rule: RateLimitRule,
): void => {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${rule.key}:${ip}`;

  const entry = localHits.get(key);
  if (!entry || now >= entry.resetAt) {
    // Evict oldest entries if the Map has grown too large (e.g., IP rotation attack).
    if (localHits.size >= LOCAL_MAP_MAX_SIZE) {
      const firstKey = localHits.keys().next().value;
      if (firstKey) localHits.delete(firstKey);
    }

    localHits.set(key, { count: 1, resetAt: now + rule.windowMs });
    setRateLimitHeaders(res, rule.maxRequests, rule.maxRequests - 1, 0);
    next();
    return;
  }

  if (entry.count >= rule.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    setRateLimitHeaders(res, rule.maxRequests, 0, retryAfter);
    res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    return;
  }

  entry.count += 1;
  setRateLimitHeaders(res, rule.maxRequests, rule.maxRequests - entry.count, 0);
  next();
};

// ---------------------------------------------------------------------------
// Redis limiter with sliding window approximation
// ---------------------------------------------------------------------------

let redisLimiterDisabledUntil = 0;

/**
 * Lua script: atomic INCR + EXPIRE.
 * Returns the current count after increment.
 *
 * This prevents the race condition where INCR succeeds but EXPIRE
 * fails (e.g., process crash), which would leave a key with no TTL
 * that permanently blocks the client.
 */
const LUA_INCR_EXPIRE = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

/**
 * Sliding window counter approximation.
 *
 * Instead of a fixed window (which allows 2x burst at window boundaries),
 * we look at the current bucket AND the previous bucket, weighting the
 * previous bucket's count by the fraction of its window that still overlaps
 * with the current sliding window.
 *
 * For example, if we're 40% into the current window:
 *   estimatedCount = previousCount * 0.6 + currentCount
 *
 * This smooths out burst behavior at window boundaries.
 */
const applySlidingWindowRedis = async (
  req: Request,
  res: Response,
  next: NextFunction,
  rule: RateLimitRule,
): Promise<void> => {
  const redisClient = getRedisClient();

  if (!redisClient) {
    applyLocalLimit(req, res, next, rule);
    return;
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const currentBucket = Math.floor(now / rule.windowMs);
  const previousBucket = currentBucket - 1;

  const currentKey = `rl:${rule.key}:${ip}:${currentBucket}`;
  const previousKey = `rl:${rule.key}:${ip}:${previousBucket}`;

  // Atomic increment of current bucket + read previous bucket in parallel.
  const [currentCount, previousCountRaw] = await Promise.all([
    redisClient.eval(LUA_INCR_EXPIRE, [currentKey], [String(rule.windowSeconds * 2)]) as Promise<number>,
    redisClient.get(previousKey) as Promise<string | null>,
  ]);

  const previousCount = Number(previousCountRaw) || 0;

  // Weight the previous window by the fraction that still overlaps.
  const elapsedFraction = (now % rule.windowMs) / rule.windowMs;
  const estimatedCount = Math.floor(previousCount * (1 - elapsedFraction)) + currentCount;

  const remaining = rule.maxRequests - estimatedCount;
  setRateLimitHeaders(
    res,
    rule.maxRequests,
    remaining,
    remaining < 0 ? rule.windowSeconds : 0,
  );

  if (estimatedCount > rule.maxRequests) {
    res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
    return;
  }

  // Redis recovered successfully — clear the disabled-until flag.
  redisLimiterDisabledUntil = 0;
  next();
};

// ---------------------------------------------------------------------------
// Exported middleware
// ---------------------------------------------------------------------------

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (shouldBypassRateLimit(req)) {
    next();
    return;
  }

  const rule = getRateLimitRule(req.path);

  // If Redis is in cooldown, fall back to local limiting.
  if (Date.now() < redisLimiterDisabledUntil) {
    applyLocalLimit(req, res, next, rule);
    return;
  }

  try {
    await applySlidingWindowRedis(req, res, next, rule);
  } catch (error: any) {
    const isDnsResolutionError =
      error?.cause?.code === "ENOTFOUND" ||
      String(error?.message || "").includes("ENOTFOUND");
    const retryCooldownMs = isDnsResolutionError
      ? REDIS_DNS_RETRY_COOLDOWN_MS
      : REDIS_RETRY_COOLDOWN_MS;

    redisLimiterDisabledUntil = Date.now() + retryCooldownMs;
    logger.warn(
      {
        retryInMs: retryCooldownMs,
        reason: isDnsResolutionError ? "dns_resolution_failed" : "redis_unavailable",
      },
      "[RATE LIMIT] Redis unavailable, using local fallback",
    );
    logger.debug(error, "[RATE LIMIT] Redis error details");
    applyLocalLimit(req, res, next, rule);
  }
};
