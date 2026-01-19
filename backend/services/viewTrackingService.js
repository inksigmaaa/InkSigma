// services/viewTrackingService.js
import { db } from "../config/database.js";
import { blog, blogView, blogShare } from "../models/schema.js";
import { eq, and, gte, sql } from "drizzle-orm";
import { getRedisClient, isRedisAvailable } from "../config/redis.js";
import crypto from "crypto";

/**
 * Generate a unique identifier for a viewer based on IP and User Agent
 */
const generateViewerIdentifier = (ip, userAgent) => {
    const hash = crypto.createHash('sha256');
    hash.update(`${ip}:${userAgent}`);
    return hash.digest('hex');
};

/**
 * Track a blog view with Redis caching and 24-hour deduplication
 * 
 * 24-HOUR COOLDOWN RULES:
 * ✅ First view: Recorded in database
 * ❌ Repeat view within 24 hours: NOT recorded (skipped)
 * ✅ View after 24+ hours: Recorded as new view
 * 
 * @param {number} blogId - The blog ID
 * @param {string} ip - The viewer's IP address
 * @param {string} userAgent - The viewer's user agent
 * @returns {Promise<{viewed: boolean, isNewView: boolean}>}
 */
export const trackBlogView = async (blogId, ip, userAgent) => {
    try {
        const viewerIdentifier = generateViewerIdentifier(ip, userAgent);
        const redisKey = `blog:${blogId}:view:${viewerIdentifier}`;
        
        console.log(`[VIEW TRACKING] Tracking view for blog ${blogId} from ${viewerIdentifier.substring(0, 10)}...`);

        // Check Redis first if available
        if (isRedisAvailable()) {
            const redis = getRedisClient();
            
            // RULE: Check if this viewer has viewed in the last 24 hours (Redis)
            // If key exists → view was within 24h → DON'T count again
            const existingView = await redis.get(redisKey);
            
            if (existingView) {
                console.log(`[VIEW TRACKING] View already tracked in Redis (within 24h) - SKIPPED`);
                return { viewed: true, isNewView: false };
            }

            // RULE: New view OR 24+ hours passed → Store in Redis with 24-hour expiry
            // After 24 hours, Redis key expires automatically, allowing next view to count
            await redis.setex(redisKey, 86400, Date.now().toString()); // 24 hours = 86400 seconds
            console.log(`[VIEW TRACKING] Stored view in Redis with 24h expiry`);
        } else {
            // Fallback: Check database for views in last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const [existingView] = await db
                .select()
                .from(blogView)
                .where(
                    and(
                        eq(blogView.blogId, blogId),
                        eq(blogView.viewerIdentifier, viewerIdentifier),
                        gte(blogView.createdAt, twentyFourHoursAgo) // Only check last 24 hours
                    )
                )
                .limit(1);

            if (existingView) {
                console.log(`[VIEW TRACKING] View already tracked in database (within 24h) - SKIPPED`);
                return { viewed: true, isNewView: false };
            }
        }

        // RULE: No existing view found within 24h → Record as NEW VIEW
        // Store view in database for permanent record
        await db.insert(blogView).values({
            blogId,
            viewerIdentifier,
            userAgent: userAgent || null,
            createdAt: new Date(),
        });

        // Increment view count in blog table
        await db
            .update(blog)
            .set({ 
                views: sql`${blog.views} + 1`
            })
            .where(eq(blog.id, blogId));

        console.log(`[VIEW TRACKING] New view recorded in database - COUNT INCREMENTED`);
        return { viewed: true, isNewView: true };

    } catch (error) {
        console.error('[VIEW TRACKING] Error tracking view:', error);
        return { viewed: false, isNewView: false };
    }
};

/**
 * Track a blog share
 * @param {number} blogId - The blog ID
 * @param {string} platform - The platform (twitter, facebook, linkedin, copy)
 * @returns {Promise<boolean>}
 */
export const trackBlogShare = async (blogId, platform) => {
    try {
        console.log(`[SHARE TRACKING] Tracking share for blog ${blogId} on ${platform}`);

        await db.insert(blogShare).values({
            blogId,
            platform,
            createdAt: new Date(),
        });

        console.log(`[SHARE TRACKING] Share recorded in database`);
        return true;

    } catch (error) {
        console.error('[SHARE TRACKING] Error tracking share:', error);
        return false;
    }
};

/**
 * Get view count for a blog
 * @param {number} blogId - The blog ID
 * @returns {Promise<number>}
 */
export const getBlogViewCount = async (blogId) => {
    try {
        const [result] = await db
            .select({ views: blog.views })
            .from(blog)
            .where(eq(blog.id, blogId));

        return result?.views || 0;
    } catch (error) {
        console.error('[VIEW TRACKING] Error getting view count:', error);
        return 0;
    }
};

/**
 * Get share count for a blog
 * @param {number} blogId - The blog ID
 * @returns {Promise<number>}
 */
export const getBlogShareCount = async (blogId) => {
    try {
        const shares = await db
            .select()
            .from(blogShare)
            .where(eq(blogShare.blogId, blogId));

        return shares.length;
    } catch (error) {
        console.error('[SHARE TRACKING] Error getting share count:', error);
        return 0;
    }
};

/**
 * Get view and share stats for multiple blogs
 * @param {number[]} blogIds - Array of blog IDs
 * @returns {Promise<Object>}
 */
export const getBlogStats = async (blogIds) => {
    try {
        const stats = {};

        for (const blogId of blogIds) {
            const [viewCount, shareCount] = await Promise.all([
                getBlogViewCount(blogId),
                getBlogShareCount(blogId)
            ]);

            stats[blogId] = {
                views: viewCount,
                shares: shareCount
            };
        }

        return stats;
    } catch (error) {
        console.error('[VIEW TRACKING] Error getting blog stats:', error);
        return {};
    }
};

export default {
    trackBlogView,
    trackBlogShare,
    getBlogViewCount,
    getBlogShareCount,
    getBlogStats
};
