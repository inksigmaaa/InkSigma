// services/invitationService.js
import { db } from "../config/database.js";
import { invitation } from "../models/schema.js";
import { eq, and, lt, or } from "drizzle-orm";

export class InvitationService {
  // Mark expired invitations
  static async markExpiredInvitations() {
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
        console.log(`📧 Marked ${result.length} invitations as expired`);
      }

      return result.length;
    } catch (error) {
      console.error("Error marking expired invitations:", error);
      return 0;
    }
  }

  // Clean up old invitations (optional - remove declined/expired after 30 days)
  static async cleanupOldInvitations() {
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
        console.log(`🗑️  Cleaned up ${result.length} old invitations`);
      }

      return result.length;
    } catch (error) {
      console.error("Error cleaning up old invitations:", error);
      return 0;
    }
  }

  // Start the invitation cleanup scheduler
  static startScheduler() {
    // Check for expired invitations every hour
    setInterval(async () => {
      await this.markExpiredInvitations();
    }, 60 * 60 * 1000); // 1 hour

    // Clean up old invitations once a day
    setInterval(async () => {
      await this.cleanupOldInvitations();
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log("📧 Invitation cleanup scheduler started");
  }
}

export default InvitationService;