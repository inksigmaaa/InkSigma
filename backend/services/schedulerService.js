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
            const now = new Date();
            console.log(`🔍 Checking for scheduled blogs at: ${now.toISOString()}`);
            
            // Find all scheduled blogs where scheduledAt <= now
            const scheduledBlogs = await db
                .select()
                .from(blog)
                .where(eq(blog.status, 'scheduled'));

            console.log(`📋 Found ${scheduledBlogs.length} total scheduled blog(s)`);
            
            if (scheduledBlogs.length > 0) {
                // Log all scheduled blogs for debugging
                scheduledBlogs.forEach(blogPost => {
                    const scheduledTime = new Date(blogPost.scheduledAt);
                    const isPastDue = scheduledTime <= now;
                    console.log(`📅 Blog "${blogPost.title}": scheduled for ${scheduledTime.toISOString()}, past due: ${isPastDue}`);
                });
                
                // Filter blogs that are past due
                const blogsToPublish = scheduledBlogs.filter(blogPost => {
                    const scheduledTime = new Date(blogPost.scheduledAt);
                    return scheduledTime <= now;
                });
                
                if (blogsToPublish.length > 0) {
                    console.log(`🚀 Publishing ${blogsToPublish.length} blog(s) that are past due`);
                    
                    for (const blogPost of blogsToPublish) {
                        await this.publishScheduledBlog(blogPost);
                    }
                } else {
                    console.log('⏳ No blogs are ready to publish yet');
                }
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
            console.log(`🚀 Publishing scheduled blog: "${blogPost.title}" (ID: ${blogPost.id})`);
            console.log(`   Scheduled for: ${new Date(blogPost.scheduledAt).toISOString()}`);
            console.log(`   Publishing at: ${new Date().toISOString()}`);
            
            // Update the blog to published status
            const [updatedBlog] = await db
                .update(blog)
                .set({
                    status: 'published',
                    published: true,
                    publishedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(blog.id, blogPost.id))
                .returning();

            console.log(`✅ Successfully published blog: "${blogPost.title}"`);
            return updatedBlog;
        } catch (error) {
            console.error(`❌ Error publishing blog "${blogPost.title}":`, error);
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