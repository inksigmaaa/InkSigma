// config/redis.js - Upstash Redis Configuration
import { Redis } from "@upstash/redis";
import logger from "../utils/logger.js";

let redisClient = null;
let redisAvailable = false;
let redisCooldownUntil = 0;
let redisLastFailureReason = null;

const REDIS_RETRY_COOLDOWN_MS = Number(
  process.env.REDIS_RETRY_COOLDOWN_MS || 60_000,
);
const REDIS_DNS_RETRY_COOLDOWN_MS = Number(
  process.env.REDIS_DNS_RETRY_COOLDOWN_MS || 600_000,
);
const REDIS_DISABLED = process.env.REDIS_DISABLED === "true";

const isRedisInCooldown = () => Date.now() < redisCooldownUntil;

const markRedisFailure = (error, context = "unknown") => {
  const message = String(error?.message || "");
  const isDnsError = error?.cause?.code === "ENOTFOUND" || message.includes("ENOTFOUND");
  const cooldownMs = isDnsError
    ? REDIS_DNS_RETRY_COOLDOWN_MS
    : REDIS_RETRY_COOLDOWN_MS;
  const nextReason = isDnsError ? "dns_resolution_failed" : "redis_unavailable";

  if (isRedisInCooldown() && redisLastFailureReason === nextReason) {
    return;
  }

  redisCooldownUntil = Date.now() + cooldownMs;
  redisLastFailureReason = nextReason;

  logger.warn(
    {
      context,
      reason: redisLastFailureReason,
      retryInMs: cooldownMs,
    },
    "[REDIS] Temporarily disabling Redis operations",
  );
};

export const reportRedisFailure = (error, context = "unknown") => {
  markRedisFailure(error, context);
};

const markRedisRecovery = () => {
  if (!redisLastFailureReason) return;

  logger.info({ reason: redisLastFailureReason }, "[REDIS] Redis operations recovered");
  redisLastFailureReason = null;
  redisCooldownUntil = 0;
};

export const getRedisClient = () => {
  if (REDIS_DISABLED) {
    redisAvailable = false;
    return null;
  }

  if (isRedisInCooldown()) {
    return null;
  }

  if (!redisClient) {
    try {
      // Upstash supports both REST API and Redis protocol
      // Using REST API (works everywhere, no connection issues)
      const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!upstashUrl || !upstashToken) {
        logger.info("[REDIS] Upstash credentials not found in .env");
        logger.info(
          "[REDIS] Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your .env file",
        );
        logger.info("[REDIS] Application will run in database-only mode");
        redisAvailable = false;
        return null;
      }

      redisClient = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });

      redisAvailable = true;
      markRedisRecovery();
      logger.info("[REDIS] Upstash Redis client initialized successfully");
    } catch (error) {
      logger.error(error.message, "[REDIS] Failed to initialize Upstash:");
      logger.info("[REDIS] Application will run in database-only mode");
      redisAvailable = false;
      markRedisFailure(error, "initialize");
      return null;
    }
  }

  return redisClient;
};

export const isRedisAvailable = () => redisAvailable && !isRedisInCooldown();

// Session storage adapter for better-auth
export const redisSessionStorage = {
  async get(sessionId) {
    if (!redisAvailable) {
      return null; // Fall back to database
    }

    try {
      const client = getRedisClient();
      if (!client) return null;

      const data = await client.get(`session:${sessionId}`);

      if (!data) {
        logger.info(`[REDIS] Session not found: ${sessionId}`);
        return null;
      }

      // Upstash returns parsed JSON automatically if it's JSON
      const session = typeof data === "string" ? JSON.parse(data) : data;
      logger.info(`[REDIS] Session retrieved: ${sessionId}`);
      return session;
    } catch (error) {
      markRedisFailure(error, "session.get");
      return null; // Fall back to database
    }
  },

  async set(sessionId, session, ttl) {
    if (!redisAvailable) {
      return false; // Fall back to database
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const data = JSON.stringify(session);

      if (ttl) {
        // TTL in seconds
        await client.setex(`session:${sessionId}`, ttl, data);
      } else {
        await client.set(`session:${sessionId}`, data);
      }

      logger.info(`[REDIS] Session stored: ${sessionId} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      markRedisFailure(error, "session.set");
      return false; // Fall back to database
    }
  },

  async delete(sessionId) {
    if (!redisAvailable) {
      return false; // Fall back to database
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(`session:${sessionId}`);
      logger.info(`[REDIS] Session deleted: ${sessionId}`);
      return true;
    } catch (error) {
      markRedisFailure(error, "session.delete");
      return false; // Fall back to database
    }
  },

  async update(sessionId, session, ttl) {
    // Update is the same as set
    return this.set(sessionId, session, ttl);
  },
};

// User cache functions
export const userCache = {
  async get(userId) {
    if (!redisAvailable) {
      return null; // Skip cache, use database
    }

    try {
      const client = getRedisClient();
      if (!client) return null;

      const data = await client.get(`user:${userId}`);

      if (!data) {
        return null;
      }

      // Upstash returns parsed JSON automatically if it's JSON
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch (error) {
      markRedisFailure(error, "userCache.get");
      return null; // Skip cache, use database
    }
  },

  async set(userId, userData, ttl = 3600) {
    if (!redisAvailable) {
      return false; // Skip cache
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const data = JSON.stringify(userData);
      await client.setex(`user:${userId}`, ttl, data);
      logger.info(`[REDIS] User cached: ${userId}`);
      return true;
    } catch (error) {
      markRedisFailure(error, "userCache.set");
      return false; // Skip cache
    }
  },

  async delete(userId) {
    if (!redisAvailable) {
      return false; // Skip cache
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(`user:${userId}`);
      logger.info(`[REDIS] User cache deleted: ${userId}`);
      return true;
    } catch (error) {
      markRedisFailure(error, "userCache.delete");
      return false; // Skip cache
    }
  },

  async invalidate(userId) {
    return this.delete(userId);
  },
};

export default {
  getRedisClient,
  redisSessionStorage,
  userCache,
  isRedisAvailable,
};
