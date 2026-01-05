import { relations } from "drizzle-orm/relations";
import { user, blog, comment, publication, session, account } from "./schema";

export const blogRelations = relations(blog, ({one, many}) => ({
	user: one(user, {
		fields: [blog.authorId],
		references: [user.id]
	}),
	comments: many(comment),
}));

export const userRelations = relations(user, ({many}) => ({
	blogs: many(blog),
	comments: many(comment),
	publications: many(publication),
	sessions: many(session),
	accounts: many(account),
}));

export const commentRelations = relations(comment, ({one}) => ({
	blog: one(blog, {
		fields: [comment.blogId],
		references: [blog.id]
	}),
	user: one(user, {
		fields: [comment.authorId],
		references: [user.id]
	}),
}));

export const publicationRelations = relations(publication, ({one}) => ({
	user: one(user, {
		fields: [publication.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));