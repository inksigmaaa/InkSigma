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

// Debug route to check scheduler status and scheduled blogs
router.get('/scheduler', async (req, res) => {
    try {
        const { schedulerService } = req.app.locals;
        const status = schedulerService.getStatus();
        
        // Get all scheduled blogs
        const scheduledBlogs = await db
            .select({
                id: blog.id,
                title: blog.title,
                status: blog.status,
                scheduledAt: blog.scheduledAt,
                authorId: blog.authorId
            })
            .from(blog)
            .where(eq(blog.status, 'scheduled'));
        
        const nowUTC = new Date();
        
        // Add timing information to each scheduled blog
        const blogsWithTiming = scheduledBlogs.map(blogPost => {
            const scheduledTimeUTC = new Date(blogPost.scheduledAt);
            const timeDiff = scheduledTimeUTC.getTime() - nowUTC.getTime();
            const minutesUntil = Math.round(timeDiff / (1000 * 60));
            
            return {
                ...blogPost,
                scheduledAtUTC: scheduledTimeUTC.toISOString(),
                isPastDue: scheduledTimeUTC <= nowUTC,
                minutesUntil: minutesUntil,
                timeDiffMs: timeDiff
            };
        });
        
        res.json({
            scheduler: status,
            currentTimeUTC: nowUTC.toISOString(),
            scheduledBlogs: blogsWithTiming,
            totalScheduled: scheduledBlogs.length,
            pastDue: blogsWithTiming.filter(b => b.isPastDue).length
        });
    } catch (error) {
        console.error('Error getting scheduler status:', error);
        res.status(500).json({ error: 'Failed to get scheduler status' });
    }
});

// Manual trigger for scheduler check
router.post('/scheduler/check', async (req, res) => {
    try {
        const { schedulerService } = req.app.locals;
        await schedulerService.manualCheck();
        res.json({ message: 'Manual scheduler check completed' });
    } catch (error) {
        console.error('Error in manual scheduler check:', error);
        res.status(500).json({ error: 'Failed to run manual scheduler check' });
    }
});

export default router;
