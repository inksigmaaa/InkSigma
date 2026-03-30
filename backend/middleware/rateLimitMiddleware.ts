import { getRedisClient } from "../config/redis.js";
import logger from "../utils/logger.js";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const WINDOW_SECONDS = Math.max(1, Math.ceil(WINDOW_MS / 1000));
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 1200);
const REDIS_RETRY_COOLDOWN_MS = Number(
  process.env.RATE_LIMIT_REDIS_RETRY_COOLDOWN_MS || 60_000,
);
const REDIS_DNS_RETRY_COOLDOWN_MS = Number(
  process.env.RATE_LIMIT_REDIS_DNS_RETRY_COOLDOWN_MS || 600_000,
);

const localHits = new Map();
let redisLimiterDisabledUntil = 0;

const shouldBypassRateLimit = (req) => {
  if (req.method === "OPTIONS") return true;
  if (req.path?.startsWith("/uploads/")) return true;
  return false;
};

const getClientIp = (req) => String(req.ip || req.socket?.remoteAddress || "unknown");

const setRateLimitHeaders = (res, remaining, retryAfterSeconds) => {
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining));
  if (retryAfterSeconds > 0) {
    res.setHeader("Retry-After", retryAfterSeconds);
  }
};

const applyLocalLimit = (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();

  const entry = localHits.get(ip);
  if (!entry || now >= entry.resetAt) {
    localHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    setRateLimitHeaders(res, MAX_REQUESTS - 1, 0);
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    setRateLimitHeaders(res, 0, retryAfter);
    return res.status(429).json({ error: "Too many requests" });
  }

  entry.count += 1;
  setRateLimitHeaders(res, MAX_REQUESTS - entry.count, 0);
  return next();
};

export const rateLimitMiddleware = async (req, res, next) => {
  if (shouldBypassRateLimit(req)) {
    return next();
  }

  if (Date.now() < redisLimiterDisabledUntil) {
    return applyLocalLimit(req, res, next);
  }

  const redisClient = getRedisClient();

  if (!redisClient) {
    return applyLocalLimit(req, res, next);
  }

  try {
    const ip = getClientIp(req);
    const windowBucket = Math.floor(Date.now() / WINDOW_MS);
    const key = `ratelimit:${ip}:${windowBucket}`;

    const currentCount = Number(await redisClient.incr(key));
    if (currentCount === 1) {
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    const remaining = MAX_REQUESTS - currentCount;
    setRateLimitHeaders(res, remaining, remaining < 0 ? WINDOW_SECONDS : 0);

    if (currentCount > MAX_REQUESTS) {
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
    return applyLocalLimit(req, res, next);
  }
};
