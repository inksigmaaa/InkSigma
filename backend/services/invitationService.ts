// services/invitationService.js
import { db } from "../config/database.js";
import { invitation } from "../models/schema.js";
import { eq, and, lt, or } from "drizzle-orm";
import logger from "../utils/logger.js";

class InvitationService {
    private expirationTimer: NodeJS.Timeout | null = null;
    private cleanupTimer: NodeJS.Timeout | null = null;

    async markExpiredInvitations(): Promise<number> {
        try {
            const now = new Date();
            
            const result = await db
                .update(invitation)
                .set({
                    status: "expired",
                    updatedAt: now,
                })
                .where(
                    and(
                        eq(invitation.status, "pending"),
                        lt(invitation.expiresAt, now)
                    )
                )
                .returning();

            if (result.length > 0) {
                logger.info(`📧 Marked ${result.length} invitations as expired`);
            }

            return result.length;
        } catch (error) {
            logger.error(error, "Error marking expired invitations:");
            return 0;
        }
    }

    async cleanupOldInvitations(): Promise<number> {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const result = await db
                .delete(invitation)
                .where(
                    and(
                        or(
                            eq(invitation.status, "declined"),
                            eq(invitation.status, "expired")
                        ),
                        lt(invitation.updatedAt, thirtyDaysAgo)
                    )
                )
                .returning();

            if (result.length > 0) {
                logger.info(`🗑️  Cleaned up ${result.length} old invitations`);
            }

            return result.length;
        } catch (error) {
            logger.error(error, "Error cleaning up old invitations:");
            return 0;
        }
    }

    startScheduler(): void {
        if (this.expirationTimer || this.cleanupTimer) {
            logger.info("📧 Invitation cleanup scheduler already running");
            return;
        }

        this.expirationTimer = setInterval(async () => {
            await this.markExpiredInvitations();
        }, 60 * 60 * 1000);

        this.cleanupTimer = setInterval(async () => {
            await this.cleanupOldInvitations();
        }, 24 * 60 * 60 * 1000);

        logger.info("📧 Invitation cleanup scheduler started");
    }

    stopScheduler(): void {
        if (this.expirationTimer) {
            clearInterval(this.expirationTimer);
            this.expirationTimer = null;
        }

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        logger.info("📧 Invitation cleanup scheduler stopped");
    }
}

const invitationService = new InvitationService();
export default invitationService;
