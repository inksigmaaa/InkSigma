// services/schedulerService.js
import { db } from '../config/database.js';
import { blog } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";
import type { InferSelectModel } from "drizzle-orm";

type BlogRow = InferSelectModel<typeof blog>;

type ScheduledBlog = {
    id: number;
    title: string;
    status: string;
    scheduledAt: Date | null;
};

class SchedulerService {
    private scheduledTimers: Map<number, NodeJS.Timeout> = new Map();

    constructor() {
        // Empty constructor - initialization happens in start()
    }

    async start(): Promise<void> {
        await this.loadScheduledBlogs();
    }

    stop(): void {
        for (const [blogId, timerId] of this.scheduledTimers) {
            clearTimeout(timerId);
        }
        this.scheduledTimers.clear();
    }

    async loadScheduledBlogs(): Promise<void> {
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

    schedulePublish(blogPost: ScheduledBlog): void {
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

    cancelSchedule(blogId: number): void {
        const timerId = this.scheduledTimers.get(blogId);
        if (timerId) {
            clearTimeout(timerId);
            this.scheduledTimers.delete(blogId);
        }
    }

    async publishScheduledBlog(blogPost: ScheduledBlog): Promise<BlogRow | undefined> {
        try {
            this.scheduledTimers.delete(blogPost.id);
            const now = new Date();

            const result = await db
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

            const updatedBlog = result[0];

            if (updatedBlog) {
                logger.info(`✅ [SCHEDULER] Published: "${blogPost.title}"`);
            }
            return updatedBlog;
        } catch (error) {
            logger.error(error, `❌ [SCHEDULER] Error publishing "${blogPost.title}":`);
            try {
                await db.update(blog).set({ status: BLOG_STATUS.DRAFT, updatedAt: new Date() }).where(eq(blog.id, blogPost.id));
                logger.info(`[SCHEDULER] Reverted blog "${blogPost.title}" to draft after publish failure`);
            } catch (revertError) {
                logger.error(revertError, `[SCHEDULER] Failed to revert blog "${blogPost.title}" to draft:`);
            }
            return undefined;
        }
    }

    async onBlogScheduled(blogId: number): Promise<void> {
        try {
            const [blogPost] = await db.select().from(blog).where(eq(blog.id, blogId));
            if (blogPost?.status === BLOG_STATUS.SCHEDULED && blogPost.scheduledAt) {
                this.schedulePublish(blogPost as ScheduledBlog);
            }
        } catch (error) {
            logger.error(error, '[SCHEDULER] Error:');
        }
    }

    onBlogUnscheduled(blogId: number): void {
        this.cancelSchedule(blogId);
    }
}

const schedulerService = new SchedulerService();
export default schedulerService;
