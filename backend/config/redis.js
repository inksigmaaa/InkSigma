// config/redis.js - Upstash Redis Configuration
import { Redis } from '@upstash/redis';

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
                console.log('[REDIS] Upstash credentials not found in .env');
                console.log('[REDIS] Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your .env file');
                console.log('[REDIS] Application will run in database-only mode');
                redisAvailable = false;
                return null;
            }

            redisClient = new Redis({
                url: upstashUrl,
                token: upstashToken,
            });

            redisAvailable = true;
            console.log('[REDIS] Upstash Redis client initialized successfully');
        } catch (error) {
            console.error('[REDIS] Failed to initialize Upstash:', error.message);
            console.log('[REDIS] Application will run in database-only mode');
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
                console.log(`[REDIS] Session not found: ${sessionId}`);
                return null;
            }
            
            // Upstash returns parsed JSON automatically if it's JSON
            const session = typeof data === 'string' ? JSON.parse(data) : data;
            console.log(`[REDIS] Session retrieved: ${sessionId}`);
            return session;
        } catch (error) {
            console.error('[REDIS] Error getting session:', error.message);
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
            
            console.log(`[REDIS] Session stored: ${sessionId} (TTL: ${ttl}s)`);
            return true;
        } catch (error) {
            console.error('[REDIS] Error setting session:', error.message);
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
            console.log(`[REDIS] Session deleted: ${sessionId}`);
            return true;
        } catch (error) {
            console.error('[REDIS] Error deleting session:', error.message);
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
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            console.error('[REDIS] Error getting user cache:', error.message);
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
            console.log(`[REDIS] User cached: ${userId}`);
            return true;
        } catch (error) {
            console.error('[REDIS] Error setting user cache:', error.message);
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
            console.log(`[REDIS] User cache deleted: ${userId}`);
            return true;
        } catch (error) {
            console.error('[REDIS] Error deleting user cache:', error.message);
            return false; // Skip cache
        }
    },

    async invalidate(userId) {
        return this.delete(userId);
    },
};

export default { getRedisClient, redisSessionStorage, userCache, isRedisAvailable };

