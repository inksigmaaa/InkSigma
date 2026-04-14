// routes/articleStatsRoutes.ts
// Combined endpoint: returns comment counts + view/share stats in a single request.
import express from "express";
import { db } from "../config/database.js";
import { comment, blogView, blogShare } from "../models/schema.js";
import { count, inArray } from "drizzle-orm";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * POST /api/article-stats/batch
 *
 * Body: { blogIds: number[] }
 *
 * Response: {
 *   [blogId: string]: { comments: number, views: number, shares: number }
 * }
 *
 * Replaces two separate calls:
 *   POST /api/comments/counts
 *   POST /api/views/stats
 */
router.post("/batch", async (req, res) => {
  try {
    const { blogIds } = req.body;

    if (!blogIds || !Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({ error: "blogIds array is required" });
    }

    const normalizedIds = blogIds
      .map((id: unknown) => Number.parseInt(String(id), 10))
      .filter((id: number) => Number.isFinite(id));

    if (normalizedIds.length === 0) {
      return res.json({});
    }

    // Initialize result map
    const result: Record<string, { comments: number; views: number; shares: number }> = {};
    for (const id of normalizedIds) {
      result[String(id)] = { comments: 0, views: 0, shares: 0 };
    }

    // Run all three queries in parallel
    const [commentRows, viewRows, shareRows] = await Promise.all([
      db
        .select({ blogId: comment.blogId, count: count() })
        .from(comment)
        .where(inArray(comment.blogId, normalizedIds))
        .groupBy(comment.blogId),
      db
        .select({ blogId: blogView.blogId, count: count() })
        .from(blogView)
        .where(inArray(blogView.blogId, normalizedIds))
        .groupBy(blogView.blogId),
      db
        .select({ blogId: blogShare.blogId, count: count() })
        .from(blogShare)
        .where(inArray(blogShare.blogId, normalizedIds))
        .groupBy(blogShare.blogId),
    ]);

    for (const row of commentRows) {
      if (result[String(row.blogId)]) result[String(row.blogId)].comments = Number(row.count) || 0;
    }
    for (const row of viewRows) {
      if (result[String(row.blogId)]) result[String(row.blogId)].views = Number(row.count) || 0;
    }
    for (const row of shareRows) {
      if (result[String(row.blogId)]) result[String(row.blogId)].shares = Number(row.count) || 0;
    }

    res.json(result);
  } catch (error) {
    logger.error(error, "Error fetching article stats batch:");
    res.status(500).json({ error: "Failed to fetch article stats" });
  }
});

export default router;
