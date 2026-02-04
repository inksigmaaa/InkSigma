import { pgTable, foreignKey, unique, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const blog = pgTable("blog", {
	id: serial().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	content: text().notNull(),
	image: text(),
	authorId: text().notNull(),
	categories: text().array(),
	published: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "blog_authorId_user_id_fk"
		}),
	unique("blog_slug_unique").on(table.slug),
]);

export const comment = pgTable("comment", {
	id: serial().primaryKey().notNull(),
	content: text().notNull(),
	blogId: integer().notNull(),
	authorId: text().notNull(),
	parentId: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.blogId],
			foreignColumns: [blog.id],
			name: "comment_blogId_blog_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "comment_authorId_user_id_fk"
		}),
]);

export const publication = pgTable("publication", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	subdomain: text().notNull(),
	customDomain: text(),
	description: text(),
	image: text(),
	logoUrl: text(),
	faviconUrl: text(),
	metaOgImageUrl: text(),
	userId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "publication_userId_user_id_fk"
		}),
	unique("publication_subdomain_unique").on(table.subdomain),
	unique("publication_customDomain_unique").on(table.customDomain),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().default(false).notNull(),
	image: text(),
	username: text(),
	bio: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}),
]);
