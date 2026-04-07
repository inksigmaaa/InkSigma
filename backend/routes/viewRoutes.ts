// routes/viewRoutes.js
import express from "express";
import {
  trackBlogView,
  trackBlogShare,
  getBlogViewCount,
  getBlogShareCount,
  getBlogStats,
} from "../services/viewTrackingService.js";
import { validate } from "../middleware/validate.js";
import * as generalValidator from "../validators/generalValidator.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * Helper to get client IP address
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

// POST /api/views/track - Track a blog view
router.post(
  "/track",
  validate(generalValidator.trackViewSchema),
  async (req, res) => {
    try {
      const { blogId } = req.body;

      if (!blogId) {
        return res.status(400).json({ error: "Blog ID is required" });
      }

      const ip = getClientIp(req);
      const userAgent = req.headers["user-agent"] || "unknown";

      const result = await trackBlogView(parseInt(blogId), ip, userAgent);

      res.json({
        success: result.viewed,
        isNewView: result.isNewView,
        message: result.isNewView ? "View tracked" : "View already tracked",
      });
    } catch (error) {
      logger.error(error, "Error tracking view:");
      res.status(500).json({ error: "Failed to track view" });
    }
  },
);

// POST /api/views/share - Track a blog share
router.post(
  "/share",
  validate(generalValidator.trackViewSchema),
  async (req, res) => {
    try {
      const { blogId, platform } = req.body;

      if (!blogId || !platform) {
        return res
          .status(400)
          .json({ error: "Blog ID and platform are required" });
      }

      const validPlatforms = [
        "twitter",
        "facebook",
        "linkedin",
        "copy",
        "whatsapp",
        "email",
      ];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const success = await trackBlogShare(parseInt(blogId), platform);

      res.json({
        success,
        message: success ? "Share tracked" : "Failed to track share",
      });
    } catch (error) {
      logger.error(error, "Error tracking share:");
      res.status(500).json({ error: "Failed to track share" });
    }
  },
);

// GET /api/views/count/:blogId - Get view count for a blog
router.get(
  "/count/:blogId",
  validate(generalValidator.byBlogIdParam),
  async (req, res) => {
    try {
      const { blogId } = req.params;
      const count = await getBlogViewCount(parseInt(blogId));

      res.json({ blogId: parseInt(blogId), views: count });
    } catch (error) {
      logger.error(error, "Error getting view count:");
      res.status(500).json({ error: "Failed to get view count" });
    }
  },
);

// GET /api/views/shares/:blogId - Get share count for a blog
router.get(
  "/shares/:blogId",
  validate(generalValidator.byBlogIdParam),
  async (req, res) => {
    try {
      const { blogId } = req.params;
      const count = await getBlogShareCount(parseInt(blogId));

      res.json({ blogId: parseInt(blogId), shares: count });
    } catch (error) {
      logger.error(error, "Error getting share count:");
      res.status(500).json({ error: "Failed to get share count" });
    }
  },
);

// POST /api/views/stats - Get view and share stats for multiple blogs
router.post("/stats", async (req, res) => {
  try {
    const { blogIds } = req.body;

    if (!blogIds || !Array.isArray(blogIds)) {
      return res.status(400).json({ error: "blogIds array is required" });
    }

    const stats = await getBlogStats(blogIds.map((id) => parseInt(id)));

    res.json(stats);
  } catch (error) {
    logger.error(error, "Error getting blog stats:");
    res.status(500).json({ error: "Failed to get blog stats" });
  }
});

export default router;
