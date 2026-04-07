// services/schedulerService.js
import { db } from '../config/database.js';
import { blog } from '../models/schema.js';
import { eq, and, lte, asc } from 'drizzle-orm';
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";
import type { InferSelectModel } from "drizzle-orm";
import { createConcurrencyLimiter, getEnvNumber } from "../utils/externalOps.js";
import sliService from "./sliService.js";

type BlogRow = InferSelectModel<typeof blog>;

type ScheduledBlog = {
    id: number;
    title: string;
    status: string;
    scheduledAt: Date | null;
};

const MAX_TIMEOUT_MS = 2_147_483_647;

class SchedulerService {
    private pollTimer: NodeJS.Timeout | null = null;
    private nextDueTimer: NodeJS.Timeout | null = null;
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
    private readonly maxBatchesPerRun = getEnvNumber(
        process.env.SCHEDULER_MAX_BATCHES_PER_RUN,
        5,
        1,
    );
    private readonly publishConcurrency = getEnvNumber(
        process.env.SCHEDULER_PUBLISH_CONCURRENCY,
        5,
        1,
    );
    private readonly runPublishLimited = createConcurrencyLimiter(this.publishConcurrency);

    constructor() {
        // Empty constructor - initialization happens in start()
    }

    async start(): Promise<void> {
        if (this.pollTimer) {
            logger.info("[SCHEDULER] Scheduler already running");
            return;
        }

        await this.processDueScheduledBlogs();
        await this.scheduleNextDueWakeup();

        this.pollTimer = setInterval(() => {
            void this.processDueScheduledBlogs();
        }, this.pollIntervalMs);
        this.pollTimer.unref?.();

        logger.info(
            `[SCHEDULER] Due-job reconciler started (${this.pollIntervalMs}ms interval, ${this.publishConcurrency} publish concurrency)`,
        );
    }

    stop(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        this.clearNextDueWakeup();
    }

    private clearNextDueWakeup(): void {
        if (this.nextDueTimer) {
            clearTimeout(this.nextDueTimer);
            this.nextDueTimer = null;
        }
    }

    private async getNextScheduledBlog(): Promise<ScheduledBlog | null> {
        try {
            const [scheduledBlog] = await db
                .select()
                .from(blog)
                .where(eq(blog.status, BLOG_STATUS.SCHEDULED))
                .orderBy(asc(blog.scheduledAt), asc(blog.id))
                .limit(1);

            return (scheduledBlog as ScheduledBlog) || null;
        } catch (error) {
            logger.error(error, '[SCHEDULER] Error loading next scheduled blog:');
            return null;
        }
    }

    private async scheduleNextDueWakeup(): Promise<void> {
        this.clearNextDueWakeup();

        const blogPost = await this.getNextScheduledBlog();
        if (!blogPost?.scheduledAt) return;

        const now = new Date();
        const scheduledTime = new Date(blogPost.scheduledAt);
        const delay = scheduledTime.getTime() - now.getTime();

        logger.info(`[SCHEDULER] Blog "${blogPost.title}":`);
        logger.info(`[SCHEDULER]   - Scheduled for: ${scheduledTime.toISOString()} (UTC)`);
        logger.info(`[SCHEDULER]   - Current time:  ${now.toISOString()} (UTC)`);
        logger.info(`[SCHEDULER]   - Delay: ${Math.round(delay / 1000)} seconds`);

        if (delay <= 0) {
            logger.info(`[SCHEDULER]   - Status: OVERDUE, publishing now`);
            void this.processDueScheduledBlogs();
        } else {
            logger.info(`[SCHEDULER]   - Status: WAITING`);
            const timeoutDelay = Math.min(delay, MAX_TIMEOUT_MS);
            this.nextDueTimer = setTimeout(() => {
                if (delay > MAX_TIMEOUT_MS) {
                    void this.scheduleNextDueWakeup();
                    return;
                }

                void this.processDueScheduledBlogs();
            }, timeoutDelay);
            this.nextDueTimer.unref?.();
        }
    }

    private async processDueScheduledBlogs(): Promise<void> {
        if (this.isProcessingDueBlogs) return;

        this.isProcessingDueBlogs = true;
        try {
            let batchCount = 0;

            while (batchCount < this.maxBatchesPerRun) {
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
                    .orderBy(asc(blog.scheduledAt), asc(blog.id))
                    .limit(this.maxDueBlogsPerTick);

                if (dueBlogs.length === 0) {
                    break;
                }

                await Promise.allSettled(
                    dueBlogs.map((dueBlog) =>
                        this.runPublishLimited(() =>
                            this.publishScheduledBlog(dueBlog as ScheduledBlog),
                        ),
                    ),
                );

                batchCount += 1;

                if (dueBlogs.length < this.maxDueBlogsPerTick) {
                    break;
                }
            }

            sliService.recordSchedulerRun({ batches: batchCount });
        } catch (error) {
            logger.error(error, "[SCHEDULER] Error processing due scheduled blogs:");
        } finally {
            this.isProcessingDueBlogs = false;
            await this.scheduleNextDueWakeup();
        }
    }

    cancelSchedule(blogId: number): void {
        void blogId;
        void this.scheduleNextDueWakeup();
    }

    async publishScheduledBlog(blogPost: ScheduledBlog): Promise<BlogRow | undefined> {
        try {
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
                sliService.recordSchedulerPublish(true);
                logger.info(`✅ [SCHEDULER] Published: "${blogPost.title}"`);
            }
            return updatedBlog;
        } catch (error) {
            sliService.recordSchedulerPublish(false);
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
                await this.scheduleNextDueWakeup();
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
