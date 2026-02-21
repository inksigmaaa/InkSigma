// services/schedulerService.js
import { db } from '../config/database.js';
import { blog } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";

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
                .where(eq(blog.status, BLOG_STATUS.SCHEDULED));

            
            for (const blogPost of scheduledBlogs) {
                this.schedulePublish(blogPost);
            }
        } catch (error) {
            logger.error(error, '[SCHEDULER] Error loading:');
        }
    }

    schedulePublish(blogPost) {
        if (!blogPost.scheduledAt) return;

        const now = new Date();
        const scheduledTime = new Date(blogPost.scheduledAt);
        const delay = scheduledTime.getTime() - now.getTime();

        this.cancelSchedule(blogPost.id);

        logger.info(`[SCHEDULER] Blog "${blogPost.title}":`);
        logger.info(`[SCHEDULER]   - Scheduled for: ${scheduledTime.toISOString()} (UTC)`);
        logger.info(`[SCHEDULER]   - Current time:  ${now.toISOString()} (UTC)`);
        logger.info(`[SCHEDULER]   - Delay: ${Math.round(delay / 1000)} seconds`);

        if (delay <= 0) {
            logger.info(`[SCHEDULER]   - Status: OVERDUE, publishing now`);
            this.publishScheduledBlog(blogPost);
        } else {
            logger.info(`[SCHEDULER]   - Status: WAITING`);
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
                    status: BLOG_STATUS.PUBLISHED,
                    published: true,
                    publishedAt: now,
                    updatedAt: now,
                    scheduledAt: null
                })
                .where(and(eq(blog.id, blogPost.id), eq(blog.status, BLOG_STATUS.SCHEDULED)))
                .returning();

            if (updatedBlog) {
                logger.info(`✅ [SCHEDULER] Published: "${blogPost.title}"`);
            }
            return updatedBlog;
        } catch (error) {
            logger.error(error, `❌ [SCHEDULER] Error publishing "${blogPost.title}":`);
            try {
                await db.update(blog).set({ status: BLOG_STATUS.DRAFT, updatedAt: new Date() }).where(eq(blog.id, blogPost.id));
            } catch (e) {}
        }
    }

    async onBlogScheduled(blogId) {
        try {
            const [blogPost] = await db.select().from(blog).where(eq(blog.id, blogId));
            if (blogPost?.status === BLOG_STATUS.SCHEDULED) {
                this.schedulePublish(blogPost);
            }
        } catch (error) {
            logger.error(error, '[SCHEDULER] Error:');
        }
    }

    onBlogUnscheduled(blogId) {
        this.cancelSchedule(blogId);
    }
}

const schedulerService = new SchedulerService();
export default schedulerService;
