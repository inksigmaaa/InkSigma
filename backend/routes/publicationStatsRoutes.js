// routes/publicationStatsRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { blog, blogView, blogShare } from "../models/schema.js";
import { eq, and, count, countDistinct } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";

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
        console.error("Auth error:", error);
        return res.status(401).json({ error: "Unauthorized" });
    }
};

// GET /api/publication-stats/:publicationId - Get stats for a publication
router.get("/:publicationId", getCurrentUser, async (req, res) => {
    try {
        const { publicationId } = req.params;

        // Get total articles count
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
                    eq(blog.status, 'published')
                )
            );

        // Get total views from blog_view table
        // First get all blog IDs for this publication
        const publicationBlogs = await db
            .select({ id: blog.id })
            .from(blog)
            .where(eq(blog.publicationId, parseInt(publicationId)));
        
        const blogIds = publicationBlogs.map(b => b.id);
        
        let totalViews = 0;
        if (blogIds.length > 0) {
            const [viewsResult] = await db
                .select({ count: count() })
                .from(blogView)
                .where(eq(blogView.blogId, blogIds[0])); // This needs to be improved for multiple blogs
            
            // Better approach: count all views for all blogs in this publication
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
        }

        // Get total shares from blog_share table
        let totalShares = 0;
        if (blogIds.length > 0) {
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
            totalShares: totalShares
        });
    } catch (error) {
        console.error("Error fetching publication stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
