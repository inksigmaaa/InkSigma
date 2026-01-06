// models/schema.js
import { pgTable, text, timestamp, boolean, serial, integer, pgEnum } from "drizzle-orm/pg-core";

// Define blog status enum
export const blogStatusEnum = pgEnum("blog_status", ["draft", "published", "unpublished", "trash"]);

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    username: text("username"),
    bio: text("bio"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const blog = pgTable("blog", {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    image: text("image"),
    authorId: text("authorId").notNull().references(() => user.id),
    categories: text("categories").array(),
    status: blogStatusEnum("status").notNull().default("draft"),
    published: boolean("published").notNull().default(false),
    scheduledAt: timestamp("scheduledAt"),
    publishedAt: timestamp("publishedAt"),
    readTime: integer("readTime"),
    views: integer("views").default(0),
    likes: integer("likes").default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const comment = pgTable("comment", {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    blogId: integer("blogId").notNull().references(() => blog.id),
    authorId: text("authorId").notNull().references(() => user.id),
    parentId: integer("parentId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const publication = pgTable("publication", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    subdomain: text("subdomain").notNull().unique(),
    description: text("description"),
    image: text("image"),
    logoUrl: text("logoUrl"),
    faviconUrl: text("faviconUrl"),
    metaOgImageUrl: text("metaOgImageUrl"),
    userId: text("userId").notNull().references(() => user.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
