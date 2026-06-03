import { getRedisClient } from "../config/redis.js";
import logger from "../utils/logger.js";

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
// Cost/abuse-sensitive endpoints: paid third-party calls (Cloudinary uploads,
// Groq transcription) and the email-existence check (enumeration surface).
const UPLOAD_MAX_REQUESTS = Number(process.env.UPLOAD_RATE_LIMIT_MAX || 40);
const TRANSCRIPTION_MAX_REQUESTS = Number(
  process.env.TRANSCRIPTION_RATE_LIMIT_MAX || 15,
);
const CHECK_EMAIL_MAX_REQUESTS = Number(
  process.env.CHECK_EMAIL_RATE_LIMIT_MAX || LOGIN_MAX_REQUESTS,
);

type RateLimitRule = {
  key: string;
  maxRequests: number;
  windowMs: number;
  windowSeconds: number;
  match?: (path: string) => boolean;
};

const localHits = new Map();
let redisLimiterDisabledUntil = 0;

setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of localHits.entries()) {
    if (!entry || now >= entry.resetAt) {
      localHits.delete(key);
    }
  }
}, WINDOW_MS).unref();

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

// Keyed by IP like the auth rules above. These sit in front of paid/abuse-prone
// endpoints; if none match, the global rule still applies (never a regression).
const COST_RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    key: "upload-image",
    maxRequests: UPLOAD_MAX_REQUESTS,
    windowMs: WINDOW_MS,
    windowSeconds: WINDOW_SECONDS,
    match: (path) =>
      path === "/api/upload-image" ||
      path === "/api/upload-image/" ||
      path === "/api/profile/image",
  },
  {
    key: "transcription",
    maxRequests: TRANSCRIPTION_MAX_REQUESTS,
    windowMs: WINDOW_MS,
    windowSeconds: WINDOW_SECONDS,
    match: (path) =>
      path === "/api/transcriptions" || path === "/api/transcriptions/",
  },
  {
    key: "check-email",
    maxRequests: CHECK_EMAIL_MAX_REQUESTS,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    windowSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS,
    match: (path) => path === "/api/custom/check-email",
  },
];

const getRateLimitRule = (path: string): RateLimitRule => {
  return (
    AUTH_RATE_LIMIT_RULES.find((rule) => rule.match?.(path)) ||
    COST_RATE_LIMIT_RULES.find((rule) => rule.match?.(path)) ||
    GLOBAL_RATE_LIMIT_RULE
  );
};

const shouldBypassRateLimit = (req) => {
  if (req.method === "OPTIONS") return true;
  if (req.path?.startsWith("/uploads/")) return true;
  if (req.path === "/health" || req.path === "/ready") return true;
  return false;
};

const getClientIp = (req) => String(req.ip || req.socket?.remoteAddress || "unknown");

const setRateLimitHeaders = (res, limit, remaining, retryAfterSeconds) => {
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining));
  if (retryAfterSeconds > 0) {
    res.setHeader("Retry-After", retryAfterSeconds);
  }
};

const applyLocalLimit = (req, res, next, rule: RateLimitRule) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${rule.key}:${ip}`;

  const entry = localHits.get(key);
  if (!entry || now >= entry.resetAt) {
    localHits.set(key, { count: 1, resetAt: now + rule.windowMs });
    setRateLimitHeaders(res, rule.maxRequests, rule.maxRequests - 1, 0);
    return next();
  }

  if (entry.count >= rule.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    setRateLimitHeaders(res, rule.maxRequests, 0, retryAfter);
    return res.status(429).json({ error: "Too many requests" });
  }

  entry.count += 1;
  setRateLimitHeaders(res, rule.maxRequests, rule.maxRequests - entry.count, 0);
  return next();
};

export const rateLimitMiddleware = async (req, res, next) => {
  if (shouldBypassRateLimit(req)) {
    return next();
  }

  const rule = getRateLimitRule(req.path);

  if (Date.now() < redisLimiterDisabledUntil) {
    return applyLocalLimit(req, res, next, rule);
  }

  const redisClient = getRedisClient();

  if (!redisClient) {
    return applyLocalLimit(req, res, next, rule);
  }

  try {
    const ip = getClientIp(req);
    const windowBucket = Math.floor(Date.now() / rule.windowMs);
    const key = `ratelimit:${rule.key}:${ip}:${windowBucket}`;

    const currentCount = Number(await redisClient.incr(key));
    if (currentCount === 1) {
      await redisClient.expire(key, rule.windowSeconds);
    }

    const remaining = rule.maxRequests - currentCount;
    setRateLimitHeaders(
      res,
      rule.maxRequests,
      remaining,
      remaining < 0 ? rule.windowSeconds : 0,
    );

    if (currentCount > rule.maxRequests) {
      return res.status(429).json({ error: "Too many requests" });
    }

    // Redis limiter recovered successfully.
    redisLimiterDisabledUntil = 0;

    return next();
  } catch (error) {
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
      "[RATE LIMIT] Redis limiter unavailable, using local fallback",
    );
    logger.debug(error, "[RATE LIMIT] Redis limiter error details");
    return applyLocalLimit(req, res, next, rule);
  }
};
