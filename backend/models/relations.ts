import { relations } from "drizzle-orm/relations";
import { 
    user, 
    blog, 
    comment, 
    publication, 
    publicationHostname,
    session, 
    account, 
    publicationMember, 
    invitation, 
    notification, 
    blogView,
    blogShare,
    subscriber,
    transaction
} from "./schema.js";

export const userRelations = relations(user, ({ many }) => ({
    blogs: many(blog),
    comments: many(comment),
    publications: many(publication),
    sessions: many(session),
    accounts: many(account),
    publicationMembers: many(publicationMember),
    invitations: many(invitation),
    notifications: many(notification),
    transactions: many(transaction),
}));

export const blogRelations = relations(blog, ({ one, many }) => ({
    author: one(user, {
        fields: [blog.authorId],
        references: [user.id],
    }),
    publication: one(publication, {
        fields: [blog.publicationId],
        references: [publication.id],
    }),
    master: one(blog, {
        fields: [blog.masterId],
        references: [blog.id],
    }),
    drafts: many(blog, {
        relationName: "masterDrafts",
    }),
    comments: many(comment),
    views: many(blogView),
    shares: many(blogShare),
}));

export const commentRelations = relations(comment, ({ one, many }) => ({
    blog: one(blog, {
        fields: [comment.blogId],
        references: [blog.id],
    }),
    author: one(user, {
        fields: [comment.authorId],
        references: [user.id],
    }),
    parent: one(comment, {
        fields: [comment.parentId],
        references: [comment.id],
        relationName: "replies",
    }),
    replies: many(comment, {
        relationName: "replies",
    }),
}));

export const publicationRelations = relations(publication, ({ one, many }) => ({
    owner: one(user, {
        fields: [publication.userId],
        references: [user.id],
    }),
    hostnames: many(publicationHostname),
    members: many(publicationMember),
    blogs: many(blog),
    invitations: many(invitation),
    subscribers: many(subscriber),
}));

export const publicationHostnameRelations = relations(
    publicationHostname,
    ({ one }) => ({
        publication: one(publication, {
            fields: [publicationHostname.publicationId],
            references: [publication.id],
        }),
    }),
);

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const publicationMemberRelations = relations(publicationMember, ({ one }) => ({
    publication: one(publication, {
        fields: [publicationMember.publicationId],
        references: [publication.id],
    }),
    user: one(user, {
        fields: [publicationMember.userId],
        references: [user.id],
    }),
    inviter: one(user, {
        fields: [publicationMember.invitedBy],
        references: [user.id],
        relationName: "invitedMembers",
    }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
    publication: one(publication, {
        fields: [invitation.publicationId],
        references: [publication.id],
    }),
    inviter: one(user, {
        fields: [invitation.inviterId],
        references: [user.id],
    }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
    user: one(user, {
        fields: [notification.userId],
        references: [user.id],
    }),
    relatedUser: one(user, {
        fields: [notification.relatedUserId],
        references: [user.id],
        relationName: "relatedNotifications",
    }),
    relatedBlog: one(blog, {
        fields: [notification.relatedBlogId],
        references: [blog.id],
    }),
    relatedPublication: one(publication, {
        fields: [notification.relatedPublicationId],
        references: [publication.id],
    }),
}));

export const blogViewRelations = relations(blogView, ({ one }) => ({
    blog: one(blog, {
        fields: [blogView.blogId],
        references: [blog.id],
    }),
}));

export const blogShareRelations = relations(blogShare, ({ one }) => ({
    blog: one(blog, {
        fields: [blogShare.blogId],
        references: [blog.id],
    }),
}));

export const subscriberRelations = relations(subscriber, ({ one }) => ({
    publication: one(publication, {
        fields: [subscriber.publicationId],
        references: [publication.id],
    }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
    user: one(user, {
        fields: [transaction.userId],
        references: [user.id],
    }),
}));
