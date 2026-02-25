import { db } from "../config/database.js";
import { notification, notificationTypeEnum } from "../models/schema.js";
import { and, eq } from "drizzle-orm";
import logger from "../utils/logger.js";

type NotificationType = typeof notificationTypeEnum.enumValues[number];

interface NotificationRow {
    id: number;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedUserId: string | null;
    relatedBlogId: number | null;
    relatedPublicationId: number | null;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedUserId?: string | null;
    relatedBlogId?: number | null;
    relatedPublicationId?: number | null;
}

class NotificationService {
    async createNotification(params: CreateNotificationParams): Promise<NotificationRow> {
        const { userId, type, title, message, relatedUserId, relatedBlogId, relatedPublicationId } = params;
        
        try {
            const result = await db
                .insert(notification)
                .values({
                    userId,
                    type,
                    title,
                    message,
                    relatedUserId,
                    relatedBlogId,
                    relatedPublicationId,
                    isRead: false,
                })
                .returning();

            return result[0];
        } catch (error) {
            logger.error(error, "Error creating notification:");
            throw error;
        }
    }

    async notifyInvitation(params: { userId: string; publicationName: string; inviterName: string; inviterId: string; publicationId: number }): Promise<NotificationRow> {
        const { userId, publicationName, inviterName, inviterId, publicationId } = params;
        return this.createNotification({
            userId,
            type: "invitation",
            title: publicationName,
            message: `${inviterName} has invited you to join their publication.`,
            relatedUserId: inviterId,
            relatedPublicationId: publicationId,
        });
    }

    async notifyBlogAccepted(params: { authorId: string; publicationName: string; blogId: number; publicationId: number }): Promise<NotificationRow> {
        const { authorId, publicationName, blogId, publicationId } = params;
        return this.createNotification({
            userId: authorId,
            type: "blog_accepted",
            title: publicationName,
            message: "Has accepted your Blog.",
            relatedBlogId: blogId,
            relatedPublicationId: publicationId,
        });
    }

    async notifyBlogRejected(params: { authorId: string; publicationName: string; blogId: number; publicationId: number }): Promise<NotificationRow> {
        const { authorId, publicationName, blogId, publicationId } = params;
        return this.createNotification({
            userId: authorId,
            type: "blog_rejected",
            title: publicationName,
            message: "Has rejected your Blog.",
            relatedBlogId: blogId,
            relatedPublicationId: publicationId,
        });
    }

    async notifyBlogReview(params: { recipientId: string; authorName: string; authorId: string; blogId: number }): Promise<NotificationRow> {
        const { recipientId, authorName, authorId, blogId } = params;
        return this.createNotification({
            userId: recipientId,
            type: "blog_review",
            title: authorName,
            message: "Has sent you a Blog for a review.",
            relatedUserId: authorId,
            relatedBlogId: blogId,
        });
    }

    async notifyBlogSubmittedForReview(params: { authorId: string; publicationName: string; blogId: number; publicationId: number }): Promise<NotificationRow> {
        const { authorId, publicationName, blogId, publicationId } = params;
        return this.createNotification({
            userId: authorId,
            type: "blog_submitted_review",
            title: publicationName,
            message: "Your blog has been submitted for review.",
            relatedBlogId: blogId,
            relatedPublicationId: publicationId,
        });
    }

    async notifyInvitationDeclined(params: { ownerId: string; memberName: string; memberId: string; publicationId: number }): Promise<NotificationRow> {
        const { ownerId, memberName, memberId, publicationId } = params;
        return this.createNotification({
            userId: ownerId,
            type: "invitation_declined",
            title: memberName,
            message: "Has declined your invitation.",
            relatedUserId: memberId,
            relatedPublicationId: publicationId,
        });
    }

    async notifyBlogPublished(params: { authorId: string; blogTitle: string; blogId: number; publicationId: number }): Promise<NotificationRow> {
        const { authorId, blogTitle, blogId, publicationId } = params;
        return this.createNotification({
            userId: authorId,
            type: "blog_published",
            title: "Blog Published",
            message: `Your blog "${blogTitle}" has been published.`,
            relatedBlogId: blogId,
            relatedPublicationId: publicationId,
        });
    }

    async notifyMemberJoined(params: { ownerId: string; memberName: string; memberId: string; publicationId: number }): Promise<NotificationRow> {
        const { ownerId, memberName, memberId, publicationId } = params;
        return this.createNotification({
            userId: ownerId,
            type: "member_joined",
            title: "New Member",
            message: `${memberName} has joined your publication.`,
            relatedUserId: memberId,
            relatedPublicationId: publicationId,
        });
    }

    async markAsRead(userId: string, notificationId: number): Promise<void> {
        await db.update(notification)
            .set({ isRead: true })
            .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)));
    }

    async markAllAsRead(userId: string): Promise<void> {
        await db.update(notification)
            .set({ isRead: true })
            .where(eq(notification.userId, userId));
    }
}

export default new NotificationService();
