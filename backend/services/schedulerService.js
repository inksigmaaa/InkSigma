// services/schedulerService.js
import { db } from '../config/database.js';
import { blog } from '../models/schema.js';
import { eq, and, lte } from 'drizzle-orm';

class SchedulerService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }

    // Start the scheduler - checks every minute for blogs to publish
    start() {
        if (this.isRunning) {
            console.log('Scheduler is already running');
            return;
        }

        console.log('Starting blog scheduler...');
        console.log('Current server time:', new Date().toISOString());
        console.log('Current server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        this.isRunning = true;
        
        // Run immediately on start
        this.checkAndPublishScheduledBlogs();
        
        // Then run every 30 seconds for more frequent checks
        this.intervalId = setInterval(() => {
            this.checkAndPublishScheduledBlogs();
        }, 30000); // 30 seconds for more responsive publishing
    }

    // Stop the scheduler
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Blog scheduler stopped');
    }

    // Check for scheduled blogs that should be published
    async checkAndPublishScheduledBlogs() {
        try {
            // Use UTC time for consistent comparison
            const nowUTC = new Date();
            console.log(`🔍 Checking for scheduled blogs at: ${nowUTC.toISOString()} (UTC)`);
            console.log(`🌍 Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
            
            // Find all scheduled blogs where scheduledAt <= now (both in UTC)
            const scheduledBlogs = await db
                .select()
                .from(blog)
                .where(and(
                    eq(blog.status, 'scheduled'),
                    lte(blog.scheduledAt, nowUTC)
                ));

            console.log(`📋 Found ${scheduledBlogs.length} blog(s) ready to publish`);
            
            // Also get all scheduled blogs for debugging
            const allScheduledBlogs = await db
                .select()
                .from(blog)
                .where(eq(blog.status, 'scheduled'));
            
            if (allScheduledBlogs.length > 0) {
                console.log(`📊 Total scheduled blogs: ${allScheduledBlogs.length}`);
                allScheduledBlogs.forEach(blogPost => {
                    const scheduledTimeUTC = new Date(blogPost.scheduledAt);
                    const isPastDue = scheduledTimeUTC <= nowUTC;
                    const timeDiff = scheduledTimeUTC.getTime() - nowUTC.getTime();
                    const minutesUntil = Math.round(timeDiff / (1000 * 60));
                    
                    console.log(`📅 "${blogPost.title}": scheduled for ${scheduledTimeUTC.toISOString()} UTC, ready: ${isPastDue}, minutes until: ${minutesUntil}`);
                });
            }
            
            if (scheduledBlogs.length > 0) {
                console.log(`🚀 Publishing ${scheduledBlogs.length} blog(s) that are past due`);
                
                for (const blogPost of scheduledBlogs) {
                    await this.publishScheduledBlog(blogPost);
                }
            } else if (allScheduledBlogs.length > 0) {
                console.log('⏳ No blogs are ready to publish yet');
            } else {
                console.log('📭 No scheduled blogs found');
            }
        } catch (error) {
            console.error('❌ Error checking scheduled blogs:', error);
        }
    }

    // Publish a single scheduled blog
    async publishScheduledBlog(blogPost) {
        try {
            const nowUTC = new Date();
            const scheduledTimeUTC = new Date(blogPost.scheduledAt);
            
            console.log(`🚀 Publishing scheduled blog: "${blogPost.title}" (ID: ${blogPost.id})`);
            console.log(`   Scheduled for: ${scheduledTimeUTC.toISOString()} UTC`);
            console.log(`   Publishing at: ${nowUTC.toISOString()} UTC`);
            console.log(`   Delay: ${Math.round((nowUTC.getTime() - scheduledTimeUTC.getTime()) / 1000)} seconds`);
            
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
            
            // Mark as failed for manual review
            try {
                await db
                    .update(blog)
                    .set({
                        status: 'draft', // Revert to draft for manual review
                        updatedAt: new Date()
                    })
                    .where(eq(blog.id, blogPost.id));
                console.log(`🔄 Reverted blog "${blogPost.title}" to draft status for manual review`);
            } catch (revertError) {
                console.error(`❌ Failed to revert blog status:`, revertError);
            }
            
            throw error;
        }
    }

    // Get status of the scheduler
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalId: this.intervalId,
            currentTime: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Manual check method for testing
    async manualCheck() {
        console.log('🔧 Manual scheduler check triggered');
        await this.checkAndPublishScheduledBlogs();
    }
}

// Create a singleton instance
const schedulerService = new SchedulerService();

export default schedulerService;