import express from "express";
import { db } from "../config/database.js";
import { notification, user } from "../models/schema.js";
import { eq, desc, and } from "drizzle-orm";

const router = express.Router();

// Get all notifications for a user
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

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
                relatedUserImage: user.image,
            })
            .from(notification)
            .leftJoin(user, eq(notification.relatedUserId, user.id))
            .where(eq(notification.userId, userId))
            .orderBy(desc(notification.createdAt))
            .limit(50);

        // Format notifications - send createdAt for client-side time calculation
        const formattedNotifications = notifications.map(notif => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            isRead: notif.isRead,
            avatar: notif.relatedUserImage || "/images/icons/profileuser.svg",
            createdAt: notif.createdAt,
            relatedBlogId: notif.relatedBlogId,
            relatedPublicationId: notif.relatedPublicationId,
        }));

        res.json({ notifications: formattedNotifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Mark notification as read
router.patch("/:notificationId/read", async (req, res) => {
    try {
        const { notificationId } = req.params;

        await db
            .update(notification)
            .set({ isRead: true, updatedAt: new Date() })
            .where(eq(notification.id, parseInt(notificationId)));

        res.json({ success: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// Mark all notifications as read for a user
router.patch("/user/:userId/read-all", async (req, res) => {
    try {
        const { userId } = req.params;

        await db
            .update(notification)
            .set({ isRead: true, updatedAt: new Date() })
            .where(and(
                eq(notification.userId, userId),
                eq(notification.isRead, false)
            ));

        res.json({ success: true });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
});

// Delete a notification
router.delete("/:notificationId", async (req, res) => {
    try {
        const { notificationId } = req.params;

        await db
            .delete(notification)
            .where(eq(notification.id, parseInt(notificationId)));

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

// Get unread count
router.get("/user/:userId/unread-count", async (req, res) => {
    try {
        const { userId } = req.params;

        const unreadNotifications = await db
            .select()
            .from(notification)
            .where(and(
                eq(notification.userId, userId),
                eq(notification.isRead, false)
            ));

        res.json({ count: unreadNotifications.length });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Failed to fetch unread count" });
    }
});

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

export default router;
