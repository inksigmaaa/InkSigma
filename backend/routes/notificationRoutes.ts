import express from "express";
import { db } from "../config/database.js";
import { notification, user, publication } from "../models/schema.js";
import { eq, desc, and, count } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  requireNotificationOwnership,
  requireUserParamAccess,
} from "../middleware/authorization.js";
import * as generalValidator from "../validators/generalValidator.js";
import logger from "../utils/logger.js";
import { config } from "../config/appConfig.js";

const router = express.Router();

// Get all notifications for a user
router.get(
  "/:userId",
  requireAuth,
  validate(generalValidator.byUserIdParam),
  requireUserParamAccess("userId"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await db
        .select({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          relatedUserId: notification.relatedUserId,
          relatedBlogId: notification.relatedBlogId,
          relatedPublicationId: notification.relatedPublicationId,
          relatedUserName: user.name,
          relatedUserEmail: user.email,
          relatedUserImage: user.image,
          publicationLogoUrl: publication.logoUrl,
        })
        .from(notification)
        .leftJoin(user, eq(notification.relatedUserId, user.id))
        .leftJoin(
          publication,
          eq(notification.relatedPublicationId, publication.id),
        )
        .where(eq(notification.userId, userId))
        .orderBy(desc(notification.createdAt))
        .limit(limit)
        .offset(offset);

      // Helper function to generate navigation URL based on notification type
      const getNavigationUrl = (notif) => {
        switch (notif.type) {
          case "invitation":
            return "/members"; // Or `/invite/${token}` if you have token-based invites
          case "blog_accepted":
            return notif.relatedBlogId
              ? `/home/preview/${notif.relatedBlogId}`
              : "/published";
          case "blog_rejected":
            return notif.relatedBlogId
              ? `/home/preview/${notif.relatedBlogId}`
              : "/draft";
          case "blog_review":
            return "/review"; // Or `/author-review` for specific review page
          case "blog_submitted_review":
            return notif.relatedBlogId
              ? `/home/preview/${notif.relatedBlogId}`
              : "/my-blogs";
          case "blog_published":
            return notif.relatedBlogId
              ? `/home/preview/${notif.relatedBlogId}`
              : "/published";
          case "invitation_declined":
            return "/members";
          case "member_joined":
            return "/members";
          default:
            return "/dashboard";
        }
      };

      // Format notifications - ensure createdAt is ISO string with timezone
      const formattedNotifications = notifications.map((notif) => {
        // For publication-related notifications, use publication logo
        let avatar = notif.relatedUserImage || "/images/icons/profileuser.svg";

        if (notif.relatedPublicationId && notif.publicationLogoUrl) {
          avatar = `${config.backend.url}${notif.publicationLogoUrl}`;
        } else if (notif.relatedUserImage) {
          avatar = notif.relatedUserImage.startsWith("http")
            ? notif.relatedUserImage
            : `${config.backend.url}${notif.relatedUserImage}`;
        }

        return {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          isRead: notif.isRead,
          avatar: avatar,
          avatarUser: {
            name: notif.relatedUserName,
            email: notif.relatedUserEmail,
            image: notif.relatedUserImage,
          },
          createdAt:
            notif.createdAt instanceof Date
              ? notif.createdAt.toISOString()
              : notif.createdAt,
          relatedBlogId: notif.relatedBlogId,
          relatedPublicationId: notif.relatedPublicationId,
          navigationUrl: getNavigationUrl(notif),
        };
      });

      res.json({ notifications: formattedNotifications });
    } catch (error) {
      logger.error(error, "Error fetching notifications:");
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },
);

// Mark notification as read
router.patch(
  "/:notificationId/read",
  requireAuth,
  validate(generalValidator.byNotificationIdParam),
  requireNotificationOwnership("notificationId"),
  async (req, res) => {
    try {
      await db
        .update(notification)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(notification.id, req.notificationId));

      res.json({ success: true });
    } catch (error) {
      logger.error(error, "Error marking notification as read:");
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },
);

// Mark all notifications as read for a user
router.patch(
  "/user/:userId/read-all",
  requireAuth,
  validate(generalValidator.byUserIdParam),
  requireUserParamAccess("userId"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      await db
        .update(notification)
        .set({ isRead: true, updatedAt: new Date() })
        .where(
          and(eq(notification.userId, userId), eq(notification.isRead, false)),
        );

      res.json({ success: true });
    } catch (error) {
      logger.error(error, "Error marking all notifications as read:");
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  },
);

// Delete a notification
router.delete(
  "/:notificationId",
  requireAuth,
  validate(generalValidator.byNotificationIdParam),
  requireNotificationOwnership("notificationId"),
  async (req, res) => {
    try {
      await db
        .delete(notification)
        .where(eq(notification.id, req.notificationId));

      res.json({ success: true });
    } catch (error) {
      logger.error(error, "Error deleting notification:");
      res.status(500).json({ error: "Failed to delete notification" });
    }
  },
);

// Get unread count
router.get(
  "/user/:userId/unread-count",
  requireAuth,
  validate(generalValidator.byUserIdParam),
  requireUserParamAccess("userId"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const [unreadResult] = await db
        .select({ count: count() })
        .from(notification)
        .where(
          and(eq(notification.userId, userId), eq(notification.isRead, false)),
        );

      res.json({ count: Number(unreadResult?.count) || 0 });
    } catch (error) {
      logger.error(error, "Error fetching unread count:");
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  },
);

export default router;
