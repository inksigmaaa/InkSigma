// services/viewTrackingService.js
import { db } from "../config/database.js";
import { blogView, blogShare } from "../models/schema.js";
import { eq, and, count, inArray } from "drizzle-orm";
import {
  getRedisClient,
  isRedisAvailable,
  reportRedisFailure,
} from "../config/redis.js";
import crypto from "crypto";
import logger from "../utils/logger.js";

const VIEW_DEDUP_TTL_SECONDS = Number(
  process.env.BLOG_VIEW_DEDUP_TTL_SECONDS || 60 * 60 * 24,
);

interface ViewResult {
    viewed: boolean;
    isNewView: boolean;
}

interface BlogStats {
    views: number;
    shares: number;
}

const generateViewerIdentifier = (ip: string, userAgent: string): string => {
  const hash = crypto.createHash("sha256");
  hash.update(`${ip}:${userAgent}`);
  return hash.digest("hex");
};

export const trackBlogView = async (blogId: number, ip: string, userAgent: string): Promise<ViewResult> => {
  try {
    const viewerIdentifier = generateViewerIdentifier(ip, userAgent);
    const redisKey = `blog:${blogId}:view:${viewerIdentifier}`;

    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const setResult = await redis.set(redisKey, Date.now().toString(), {
            nx: true,
            ex: VIEW_DEDUP_TTL_SECONDS,
          });
          if (!setResult) {
            return { viewed: true, isNewView: false };
          }
        } catch (redisError) {
          reportRedisFailure(redisError, "viewTracking.redis.set");
        }
      }

      // Fall through to database check when Redis is unavailable.
    }

    const insertedRows = await db
      .insert(blogView)
      .values({
        blogId,
        viewerIdentifier,
        userAgent: userAgent || null,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: blogView.id });

    return { viewed: true, isNewView: insertedRows.length > 0 };
  } catch (error) {
    logger.error(error, "[VIEW TRACKING] Error tracking view:");
    return { viewed: false, isNewView: false };
  }
};

export const trackBlogShare = async (blogId: number, platform: string): Promise<boolean> => {
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

export const getBlogViewCount = async (blogId: number): Promise<number> => {
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

export const getBlogShareCount = async (blogId: number): Promise<number> => {
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

export const getBlogStats = async (blogIds: number[]): Promise<Record<string, BlogStats>> => {
  try {
    const stats: Record<string, BlogStats> = {};
    if (!blogIds || blogIds.length === 0) return stats;

    for (const id of blogIds) {
      stats[String(id)] = { views: 0, shares: 0 };
    }

    const viewsResult = await db
      .select({ blogId: blogView.blogId, count: count() })
      .from(blogView)
      .where(inArray(blogView.blogId, blogIds))
      .groupBy(blogView.blogId);

    const sharesResult = await db
      .select({ blogId: blogShare.blogId, count: count() })
      .from(blogShare)
      .where(inArray(blogShare.blogId, blogIds))
      .groupBy(blogShare.blogId);

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
