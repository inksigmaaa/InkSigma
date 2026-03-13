// routes/publicationStatsRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { blog, blogView, blogShare, comment } from "../models/schema.js";
import { eq, and, count } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";

const router = express.Router();

// Middleware to get current user from session
const getCurrentUser = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.user = session.user;
        next();
    } catch (error) {
        logger.error(error, "Auth error:");
        return res.status(401).json({ error: "Unauthorized" });
    }
};

// GET /api/publication-stats/:publicationId - Get stats for a publication
router.get("/:publicationId", getCurrentUser, async (req, res) => {
    try {
        const { publicationId } = req.params;

        // Get total articles count (all statuses)
        const [totalResult] = await db
            .select({ count: count() })
            .from(blog)
            .where(eq(blog.publicationId, parseInt(publicationId)));

        // Get published articles count
        const [publishedResult] = await db
            .select({ count: count() })
            .from(blog)
            .where(
                and(
                    eq(blog.publicationId, parseInt(publicationId)),
                    eq(blog.status, BLOG_STATUS.PUBLISHED)
                )
            );

        // Get only PUBLISHED blog IDs for this publication (for stats calculation)
        const publicationBlogs = await db
            .select({ id: blog.id })
            .from(blog)
            .where(
                and(
                    eq(blog.publicationId, parseInt(publicationId)),
                    eq(blog.status, BLOG_STATUS.PUBLISHED)
                )
            );
        
        const blogIds = publicationBlogs.map(b => b.id);
        
        let totalViews = 0;
        let totalComments = 0;
        let totalShares = 0;
        
        if (blogIds.length > 0) {
            // Get total views from blog_view table for published blogs only
            const viewCounts = await Promise.all(
                blogIds.map(async (blogId) => {
                    const [result] = await db
                        .select({ count: count() })
                        .from(blogView)
                        .where(eq(blogView.blogId, blogId));
                    return result.count || 0;
                })
            );
            totalViews = viewCounts.reduce((sum, count) => sum + count, 0);

            // Get total comments from comment table for published blogs only
            const commentCounts = await Promise.all(
                blogIds.map(async (blogId) => {
                    const [result] = await db
                        .select({ count: count() })
                        .from(comment)
                        .where(eq(comment.blogId, blogId));
                    return result.count || 0;
                })
            );
            totalComments = commentCounts.reduce((sum, count) => sum + count, 0);

            // Get total shares from blog_share table for published blogs only
            const shareCounts = await Promise.all(
                blogIds.map(async (blogId) => {
                    const [result] = await db
                        .select({ count: count() })
                        .from(blogShare)
                        .where(eq(blogShare.blogId, blogId));
                    return result.count || 0;
                })
            );
            totalShares = shareCounts.reduce((sum, count) => sum + count, 0);
        }

        res.json({
            totalArticles: totalResult.count || 0,
            publishedArticles: publishedResult.count || 0,
            totalViews: totalViews,
            totalLikes: totalComments,
            totalShares: totalShares
        });
    } catch (error) {
        logger.error(error, "Error fetching publication stats:");
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
