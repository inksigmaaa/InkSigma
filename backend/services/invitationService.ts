// services/invitationService.js
import { db } from "../config/database.js";
import { invitation } from "../models/schema.js";
import { eq, and, lt, or } from "drizzle-orm";
import logger from "../utils/logger.js";

class InvitationService {
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
        setInterval(async () => {
            await this.markExpiredInvitations();
        }, 60 * 60 * 1000);

        setInterval(async () => {
            await this.cleanupOldInvitations();
        }, 24 * 60 * 60 * 1000);

        logger.info("📧 Invitation cleanup scheduler started");
    }
}

const invitationService = new InvitationService();
export default invitationService;