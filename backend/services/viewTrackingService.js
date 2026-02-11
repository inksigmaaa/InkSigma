// services/viewTrackingService.js
import { db } from "../config/database.js";
import { blogView, blogShare } from "../models/schema.js";
import { eq, and } from "drizzle-orm";
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
 * Track a blog view with Redis caching and lifetime deduplication
 *
 * LIFETIME DEDUPE RULES:
 * ✅ First view (per viewerIdentifier): Recorded in database
 * ❌ Repeat views (same viewerIdentifier): NOT recorded (skipped)
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

            // RULE: Attempt to claim the view in Redis (atomic)
            // If key already exists → already counted → DON'T count again
            const setResult = await redis.set(redisKey, Date.now().toString(), "NX");
            if (!setResult) {
                console.log(`[VIEW TRACKING] View already tracked in Redis - SKIPPED`);
                return { viewed: true, isNewView: false };
            }
        } else {
            // Fallback: Check database for any prior view
            const [existingView] = await db
                .select()
                .from(blogView)
                .where(
                    and(
                        eq(blogView.blogId, blogId),
                        eq(blogView.viewerIdentifier, viewerIdentifier)
                    )
                )
                .limit(1);

            if (existingView) {
                console.log(`[VIEW TRACKING] View already tracked in database - SKIPPED`);
                return { viewed: true, isNewView: false };
            }
        }

        // RULE: No existing view found → Record as NEW VIEW
        await db.insert(blogView).values({
            blogId,
            viewerIdentifier,
            userAgent: userAgent || null,
            createdAt: new Date(),
        });

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
 * Get view count for a blog by counting records in blogView table
 * @param {number} blogId - The blog ID
 * @returns {Promise<number>}
 */
export const getBlogViewCount = async (blogId) => {
    try {
        const views = await db
            .select()
            .from(blogView)
            .where(eq(blogView.blogId, blogId));

        return views.length;
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
