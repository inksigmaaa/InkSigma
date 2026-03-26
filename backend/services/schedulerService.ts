// services/schedulerService.js
import { db } from '../config/database.js';
import { blog } from '../models/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";
import type { InferSelectModel } from "drizzle-orm";
import { getEnvNumber } from "../utils/externalOps.js";

type BlogRow = InferSelectModel<typeof blog>;

type ScheduledBlog = {
    id: number;
    title: string;
    status: string;
    scheduledAt: Date | null;
};

const MAX_TIMEOUT_MS = 2_147_483_647;

class SchedulerService {
    private scheduledTimers: Map<number, NodeJS.Timeout> = new Map();
    private pollTimer: NodeJS.Timeout | null = null;
    private isProcessingDueBlogs = false;
    private readonly pollIntervalMs = getEnvNumber(
        process.env.SCHEDULER_POLL_INTERVAL_MS,
        30_000,
        1_000,
    );
    private readonly maxDueBlogsPerTick = getEnvNumber(
        process.env.SCHEDULER_MAX_DUE_BLOGS_PER_TICK,
        50,
        1,
    );

    constructor() {
        // Empty constructor - initialization happens in start()
    }

    async start(): Promise<void> {
        if (this.pollTimer) {
            logger.info("[SCHEDULER] Scheduler already running");
            return;
        }

        await this.loadScheduledBlogs();
        await this.processDueScheduledBlogs();

        this.pollTimer = setInterval(() => {
            void this.processDueScheduledBlogs();
        }, this.pollIntervalMs);

        logger.info(
            `[SCHEDULER] Due-job reconciler started (${this.pollIntervalMs}ms interval)`,
        );
    }

    stop(): void {
        for (const [blogId, timerId] of this.scheduledTimers) {
            clearTimeout(timerId);
        }
        this.scheduledTimers.clear();

        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    async loadScheduledBlogs(): Promise<void> {
        try {
            const scheduledBlogs = await db
                .select()
                .from(blog)
                .where(eq(blog.status, BLOG_STATUS.SCHEDULED));

            
            for (const blogPost of scheduledBlogs) {
                this.schedulePublish(blogPost as ScheduledBlog);
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
            void this.publishScheduledBlog(blogPost);
        } else {
            logger.info(`[SCHEDULER]   - Status: WAITING`);
            const timeoutDelay = Math.min(delay, MAX_TIMEOUT_MS);
            const timerId = setTimeout(() => {
                if (delay > MAX_TIMEOUT_MS) {
                    this.schedulePublish(blogPost);
                    return;
                }

                void this.publishScheduledBlog(blogPost);
            }, timeoutDelay);
            this.scheduledTimers.set(blogPost.id, timerId);
        }
    }

    private async processDueScheduledBlogs(): Promise<void> {
        if (this.isProcessingDueBlogs) return;

        this.isProcessingDueBlogs = true;
        try {
            const now = new Date();
            const dueBlogs = await db
                .select()
                .from(blog)
                .where(
                    and(
                        eq(blog.status, BLOG_STATUS.SCHEDULED),
                        lte(blog.scheduledAt, now),
                    ),
                )
                .limit(this.maxDueBlogsPerTick);

            for (const dueBlog of dueBlogs) {
                await this.publishScheduledBlog(dueBlog as ScheduledBlog);
            }
        } catch (error) {
            logger.error(error, "[SCHEDULER] Error processing due scheduled blogs:");
        } finally {
            this.isProcessingDueBlogs = false;
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
