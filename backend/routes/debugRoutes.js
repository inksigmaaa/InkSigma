// routes/debugRoutes.js
import express from "express";
import { authService } from "../services/authService.js";
import { db } from "../config/database.js";
import { blog } from "../models/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// Debug route to check all users
router.get("/users", async (req, res) => {
    try {
        const users = await authService.getAllUsers();
        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("[DEBUG] Error fetching users:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Debug route to cleanup unverified users
router.post("/cleanup", async (req, res) => {
    try {
        const deletedCount = await authService.cleanupUnverifiedUsers();
        res.json({
            success: true,
            message: `Cleaned up ${deletedCount} unverified users`,
            deletedCount,
        });
    } catch (error) {
        console.error("[DEBUG] Error during cleanup:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Debug route to sync blog status and published fields
router.post("/sync-blog-status", async (req, res) => {
    try {
        console.log("Starting blog status synchronization...");

        // Get all blogs
        const allBlogs = await db.select().from(blog);
        console.log(`Found ${allBlogs.length} total blog(s)`);

        let updatedCount = 0;
        const updates = [];

        // Update each blog to ensure status and published are in sync
        for (const blogPost of allBlogs) {
            const shouldBePublished = blogPost.status === 'published';
            
            // Check if update is needed
            if (blogPost.published !== shouldBePublished) {
                await db
                    .update(blog)
                    .set({ 
                        published: shouldBePublished,
                        updatedAt: new Date()
                    })
                    .where(eq(blog.id, blogPost.id));
                
                const updateInfo = {
                    id: blogPost.id,
                    title: blogPost.title,
                    status: blogPost.status,
                    oldPublished: blogPost.published,
                    newPublished: shouldBePublished
                };
                
                console.log(`Updated blog #${blogPost.id} "${blogPost.title}": status=${blogPost.status}, published=${blogPost.published} → ${shouldBePublished}`);
                updates.push(updateInfo);
                updatedCount++;
            }
        }

        // Get updated stats
        const updatedBlogs = await db.select().from(blog);
        const stats = {};
        
        updatedBlogs.forEach(b => {
            const key = `${b.status} (published=${b.published})`;
            stats[key] = (stats[key] || 0) + 1;
        });

        res.json({
            success: true,
            message: `Synchronized ${updatedCount} blog(s)`,
            totalBlogs: allBlogs.length,
            updatedCount,
            updates,
            currentStats: stats
        });
    } catch (error) {
        console.error("[DEBUG] Error syncing blog status:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
