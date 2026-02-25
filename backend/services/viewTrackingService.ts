// services/viewTrackingService.js
import { db } from "../config/database.js";
import { blogView, blogShare } from "../models/schema.js";
import { eq, and, count, inArray } from "drizzle-orm";
import { getRedisClient, isRedisAvailable } from "../config/redis.js";
import crypto from "crypto";
import logger from "../utils/logger.js";

/**
 * Generate a unique identifier for a viewer based on IP and User Agent
 */
const generateViewerIdentifier = (ip, userAgent) => {
  const hash = crypto.createHash("sha256");
  hash.update(`${ip}:${userAgent}`);
  return hash.digest("hex");
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

    // Check Redis first if available
    if (isRedisAvailable()) {
      const redis = getRedisClient();

      // RULE: Attempt to claim the view in Redis (atomic)
      // If key already exists → already counted → DON'T count again
      const setResult = await redis.set(redisKey, Date.now().toString(), "NX");
      if (!setResult) {
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
            eq(blogView.viewerIdentifier, viewerIdentifier),
          ),
        )
        .limit(1);

      if (existingView) {
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

    return { viewed: true, isNewView: true };
  } catch (error) {
    logger.error(error, "[VIEW TRACKING] Error tracking view:");
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
    await db.insert(blogShare).values({
      blogId,
      platform,
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    logger.error(error, "[SHARE TRACKING] Error tracking share:");
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
    const result = await db
      .select({ count: count() })
      .from(blogView)
      .where(eq(blogView.blogId, blogId));

    return Number(result[0]?.count || 0);
  } catch (error) {
    logger.error(error, "[VIEW TRACKING] Error getting view count:");
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
    const result = await db
      .select({ count: count() })
      .from(blogShare)
      .where(eq(blogShare.blogId, blogId));

    return Number(result[0]?.count || 0);
  } catch (error) {
    logger.error(error, "[SHARE TRACKING] Error getting share count:");
    return 0;
  }
};

/**
 * Get view and share stats for multiple blogs
 * @param {number[]} blogIds - Array of blog IDs
 * @returns {Promise<Object>}
 */
export const getBlogStats = async (blogIds: number[]) => {
  try {
    const stats: Record<string, { views: number; shares: number }> = {};
    if (!blogIds || blogIds.length === 0) return stats;

    // Initialize with default 0s
    for (const id of blogIds) {
      stats[String(id)] = { views: 0, shares: 0 };
    }

    // Batch fetch views
    const viewsResult = await db
      .select({ blogId: blogView.blogId, count: count() })
      .from(blogView)
      .where(inArray(blogView.blogId, blogIds))
      .groupBy(blogView.blogId);

    // Batch fetch shares
    const sharesResult = await db
      .select({ blogId: blogShare.blogId, count: count() })
      .from(blogShare)
      .where(inArray(blogShare.blogId, blogIds))
      .groupBy(blogShare.blogId);

    // Map results
    for (const row of viewsResult) {
      if (stats[String(row.blogId)]) stats[String(row.blogId)].views = Number(row.count) || 0;
    }

    for (const row of sharesResult) {
      if (stats[String(row.blogId)])
        stats[String(row.blogId)].shares = Number(row.count) || 0;
    }

    return stats;
  } catch (error) {
    logger.error(error, "[VIEW TRACKING] Error getting batch blog stats:");
    return {};
  }
};

export default {
  trackBlogView,
  trackBlogShare,
  getBlogViewCount,
  getBlogShareCount,
  getBlogStats,
};
