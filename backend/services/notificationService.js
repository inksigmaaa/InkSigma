import { db } from "../config/database.js";
import { notification } from "../models/schema.js";

class NotificationService {
    // Create a notification
    async createNotification({ userId, type, title, message, relatedUserId, relatedBlogId, relatedPublicationId }) {
        try {
            const [newNotification] = await db
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

            return newNotification;
        } catch (error) {
            console.error("Error creating notification:", error);
            throw error;
        }
    }

    // Notify user about publication invitation
    async notifyInvitation({ userId, publicationName, inviterName, inviterId, publicationId }) {
        return this.createNotification({
            userId,
            type: "invitation",
            title: publicationName,
            message: `${inviterName} has invited you to join their publication.`,
            relatedUserId: inviterId,
            relatedPublicationId: publicationId,
        });
    }

    // Notify author that their blog was accepted
    async notifyBlogAccepted({ authorId, publicationName, blogId, publicationId }) {
        return this.createNotification({
            userId: authorId,
            type: "blog_accepted",
            title: publicationName,
            message: "Has accepted your Blog.",
            relatedBlogId: blogId,
            relatedPublicationId: publicationId,
        });
    }

    // Notify author that their blog was rejected
    async notifyBlogRejected({ authorId, publicationName, blogId, publicationId }) {
        return this.createNotification({
            userId: authorId,
            type: "blog_rejected",
            title: publicationName,
            message: "Has rejected your Blog.",
            relatedBlogId: blogId,
            relatedPublicationId: publicationId,
        });
    }

    // Notify publication members about blog review request
    async notifyBlogReview({ recipientId, authorName, authorId, blogId }) {
        console.log(`[NOTIFICATION] Creating blog_review notification for ${recipientId} from ${authorName} (${authorId}) for blog ${blogId}`);
        return this.createNotification({
            userId: recipientId,
            type: "blog_review",
            title: authorName,
            message: "Has sent you a Blog for a review.",
            relatedUserId: authorId,
            relatedBlogId: blogId,
        });
    }

    // Notify author that their blog has been submitted for review
    async notifyBlogSubmittedForReview({ authorId, publicationName, blogId, publicationId }) {
        console.log(`[NOTIFICATION] Creating blog_submitted_review notification for ${authorId} from publication ${publicationName} (${publicationId}) for blog ${blogId}`);
        return this.createNotification({
            userId: authorId,
            type: "blog_submitted_review",
            title: publicationName,
            message: "Your blog has been submitted for review.",
            relatedBlogId: blogId,
            relatedPublicationId: publicationId,
        });
    }

    // Notify when invitation is declined
    async notifyInvitationDeclined({ ownerId, memberName, memberId, publicationId }) {
        return this.createNotification({
            userId: ownerId,
            type: "invitation_declined",
            title: memberName,
            message: "Has declined your invitation.",
            relatedUserId: memberId,
            relatedPublicationId: publicationId,
        });
    }

    // Notify when blog is published
    async notifyBlogPublished({ authorId, blogTitle, blogId }) {
        return this.createNotification({
            userId: authorId,
            type: "blog_published",
            title: "Blog Published",
            message: `Your blog "${blogTitle}" has been published.`,
            relatedBlogId: blogId,
        });
    }

    // Notify publication owner when member joins
    async notifyMemberJoined({ ownerId, memberName, memberId, publicationId }) {
        return this.createNotification({
            userId: ownerId,
            type: "member_joined",
            title: "New Member",
            message: `${memberName} has joined your publication.`,
            relatedUserId: memberId,
            relatedPublicationId: publicationId,
        });
    }
}

export default new NotificationService();
