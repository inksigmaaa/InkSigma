// routes/publicationStatsRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { blog, blogView, blogShare, comment } from "../models/schema.js";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { requirePublicationRole } from "../middleware/authorization.js";
import { validate } from "../middleware/validate.js";
import * as generalValidator from "../validators/generalValidator.js";
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";

const router = express.Router();

// GET /api/publication-stats/:publicationId - Get stats for a publication
router.get(
    "/:publicationId",
    requireAuth,
    validate(generalValidator.byPublicationIdParam),
    requirePublicationRole(["admin", "editor", "author"], { publicationIdParam: "publicationId" }),
    async (req, res) => {
    try {
        const publicationId = parseInt(req.params.publicationId, 10);

        // Get total articles count (all statuses)
        const [totalResult] = await db
            .select({ count: count() })
            .from(blog)
            .where(eq(blog.publicationId, publicationId));

        // Get published articles count
        const [publishedResult] = await db
            .select({ count: count() })
            .from(blog)
            .where(
                and(
                    eq(blog.publicationId, publicationId),
                    eq(blog.status, BLOG_STATUS.PUBLISHED)
                )
            );

        // Aggregate engagement metrics in set-based queries for published blogs
        const [viewsResult] = await db
            .select({ count: count() })
            .from(blogView)
            .innerJoin(blog, eq(blogView.blogId, blog.id))
            .where(
                and(
                    eq(blog.publicationId, publicationId),
                    eq(blog.status, BLOG_STATUS.PUBLISHED)
                )
            );

        const [commentsResult] = await db
            .select({ count: count() })
            .from(comment)
            .innerJoin(blog, eq(comment.blogId, blog.id))
            .where(
                and(
                    eq(blog.publicationId, publicationId),
                    eq(blog.status, BLOG_STATUS.PUBLISHED)
                )
            );

        const [sharesResult] = await db
            .select({ count: count() })
            .from(blogShare)
            .innerJoin(blog, eq(blogShare.blogId, blog.id))
            .where(
                and(
                    eq(blog.publicationId, publicationId),
                    eq(blog.status, BLOG_STATUS.PUBLISHED)
                )
            );

        res.json({
            totalArticles: totalResult.count || 0,
            publishedArticles: publishedResult.count || 0,
            totalViews: viewsResult.count || 0,
            totalLikes: commentsResult.count || 0,
            totalShares: sharesResult.count || 0
        });
    } catch (error) {
        logger.error(error, "Error fetching publication stats:");
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
