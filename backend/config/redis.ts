// config/redis.js - Upstash Redis Configuration
import { Redis } from "@upstash/redis";
import logger from "../utils/logger.js";

let redisClient = null;
let redisAvailable = false;

export const getRedisClient = () => {
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
      logger.info("[REDIS] Upstash Redis client initialized successfully");
    } catch (error) {
      logger.error(error.message, "[REDIS] Failed to initialize Upstash:");
      logger.info("[REDIS] Application will run in database-only mode");
      redisAvailable = false;
      return null;
    }
  }

  return redisClient;
};

export const isRedisAvailable = () => redisAvailable;

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
      logger.error(error.message, "[REDIS] Error getting session:");
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
        await client.set(`session:${sessionId}`);
      }

      logger.info(`[REDIS] Session stored: ${sessionId} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(error.message, "[REDIS] Error setting session:");
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
      logger.error(error.message, "[REDIS] Error deleting session:");
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
      logger.error(error.message, "[REDIS] Error getting user cache:");
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
      logger.error(error.message, "[REDIS] Error setting user cache:");
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
      logger.error(error.message, "[REDIS] Error deleting user cache:");
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
