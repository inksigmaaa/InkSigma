// services/schedulerService.js
import { db } from '../config/database.js';
import { blog } from '../models/schema.js';
import { eq, and, lte } from 'drizzle-orm';

class SchedulerService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }

    // Start the scheduler
    start() {
        if (this.isRunning) return;

        this.isRunning = true;

        // Run immediately on start
        this.checkAndPublishScheduledBlogs();

        // Run every 30 seconds
        this.intervalId = setInterval(() => {
            this.checkAndPublishScheduledBlogs();
        }, 30000);
    }

    // Stop the scheduler
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    // Check for scheduled blogs that should be published
    async checkAndPublishScheduledBlogs() {
        try {
            const nowUTC = new Date();

            // Find all scheduled blogs where scheduledAt <= now
            const scheduledBlogs = await db
                .select()
                .from(blog)
                .where(and(
                    eq(blog.status, 'scheduled'),
                    lte(blog.scheduledAt, nowUTC)
                ));

            if (scheduledBlogs.length > 0) {
                console.log(` Found ${scheduledBlogs.length} blog(s) due for publishing.`);
                
                for (const blogPost of scheduledBlogs) {
                    await this.publishScheduledBlog(blogPost);
                }
            }
        } catch (error) {
            console.error(' Error checking scheduled blogs:', error);
        }
    }

    // Publish a single scheduled blog
    async publishScheduledBlog(blogPost) {
        try {
            const nowUTC = new Date();

            // Update the blog to published status
            const [updatedBlog] = await db
                .update(blog)
                .set({
                    status: 'published',
                    published: true,
                    publishedAt: nowUTC,
                    updatedAt: nowUTC,
                    scheduledAt: null // Clear the scheduled time
                })
                .where(eq(blog.id, blogPost.id))
                .returning();

            console.log(`✅ Successfully published blog: "${blogPost.title}"`);
            return updatedBlog;
        } catch (error) {
            console.error(`❌ Error publishing blog "${blogPost.title}":`, error);

            // Mark as failed (revert to draft) for manual review
            try {
                await db
                    .update(blog)
                    .set({
                        status: 'draft',
                        updatedAt: new Date()
                    })
                    .where(eq(blog.id, blogPost.id));
            } catch (revertError) {
                console.error(`❌ Failed to revert blog status:`, revertError);
            }
        }
    }
}

// Create a singleton instance
const schedulerService = new SchedulerService();

export default schedulerService;