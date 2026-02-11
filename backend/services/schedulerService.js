// services/schedulerService.js
import { db } from '../config/database.js';
import { blog } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';

class SchedulerService {
    constructor() {
        this.scheduledTimers = new Map();
    }

    async start() {
        await this.loadScheduledBlogs();
    }

    stop() {
        for (const [blogId, timerId] of this.scheduledTimers) {
            clearTimeout(timerId);
        }
        this.scheduledTimers.clear();
    }

    async loadScheduledBlogs() {
        try {
            const scheduledBlogs = await db
                .select()
                .from(blog)
                .where(eq(blog.status, 'scheduled'));

            
            for (const blogPost of scheduledBlogs) {
                this.schedulePublish(blogPost);
            }
        } catch (error) {
            console.error('[SCHEDULER] Error loading:', error);
        }
    }

    schedulePublish(blogPost) {
        if (!blogPost.scheduledAt) return;

        const now = new Date();
        const scheduledTime = new Date(blogPost.scheduledAt);
        const delay = scheduledTime.getTime() - now.getTime();

        this.cancelSchedule(blogPost.id);

        console.log(`[SCHEDULER] Blog "${blogPost.title}":`);
        console.log(`[SCHEDULER]   - Scheduled for: ${scheduledTime.toISOString()} (UTC)`);
        console.log(`[SCHEDULER]   - Current time:  ${now.toISOString()} (UTC)`);
        console.log(`[SCHEDULER]   - Delay: ${Math.round(delay / 1000)} seconds`);

        if (delay <= 0) {
            console.log(`[SCHEDULER]   - Status: OVERDUE, publishing now`);
            this.publishScheduledBlog(blogPost);
        } else {
            console.log(`[SCHEDULER]   - Status: WAITING`);
            const timerId = setTimeout(() => {
                this.publishScheduledBlog(blogPost);
            }, delay);
            this.scheduledTimers.set(blogPost.id, timerId);
        }
    }

    cancelSchedule(blogId) {
        const timerId = this.scheduledTimers.get(blogId);
        if (timerId) {
            clearTimeout(timerId);
            this.scheduledTimers.delete(blogId);
        }
    }

    async publishScheduledBlog(blogPost) {
        try {
            this.scheduledTimers.delete(blogPost.id);
            const now = new Date();

            const [updatedBlog] = await db
                .update(blog)
                .set({
                    status: 'published',
                    published: true,
                    publishedAt: now,
                    updatedAt: now,
                    scheduledAt: null
                })
                .where(and(eq(blog.id, blogPost.id), eq(blog.status, 'scheduled')))
                .returning();

            if (updatedBlog) {
                console.log(`✅ [SCHEDULER] Published: "${blogPost.title}"`);
            }
            return updatedBlog;
        } catch (error) {
            console.error(`❌ [SCHEDULER] Error publishing "${blogPost.title}":`, error);
            try {
                await db.update(blog).set({ status: 'draft', updatedAt: new Date() }).where(eq(blog.id, blogPost.id));
            } catch (e) {}
        }
    }

    async onBlogScheduled(blogId) {
        try {
            const [blogPost] = await db.select().from(blog).where(eq(blog.id, blogId));
            if (blogPost?.status === 'scheduled') {
                this.schedulePublish(blogPost);
            }
        } catch (error) {
            console.error('[SCHEDULER] Error:', error);
        }
    }

    onBlogUnscheduled(blogId) {
        this.cancelSchedule(blogId);
    }
}

const schedulerService = new SchedulerService();
export default schedulerService;
