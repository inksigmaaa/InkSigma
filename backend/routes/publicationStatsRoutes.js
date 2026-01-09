// routes/publicationStatsRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { blog } from "../models/schema.js";
import { eq, and, count, sum } from "drizzle-orm";
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

        // Get total views
        const [viewsResult] = await db
            .select({ total: sum(blog.views) })
            .from(blog)
            .where(eq(blog.publicationId, parseInt(publicationId)));

        // Get total likes (comments)
        const [likesResult] = await db
            .select({ total: sum(blog.likes) })
            .from(blog)
            .where(eq(blog.publicationId, parseInt(publicationId)));

        res.json({
            totalArticles: totalResult.count || 0,
            publishedArticles: publishedResult.count || 0,
            totalViews: parseInt(viewsResult.total) || 0,
            totalLikes: parseInt(likesResult.total) || 0
        });
    } catch (error) {
        console.error("Error fetching publication stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
