// models/schema.js
import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

// Define blog status enum
export const blogStatusEnum = pgEnum("blog_status", [
  "draft",
  "published",
  "unpublished",
  "trash",
  "scheduled",
  "review",
]);

// Define member role enum
export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "editor",
  "author",
]);

// Define invitation status enum
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

// Define notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "invitation",
  "invitation_declined",
  "blog_accepted",
  "blog_rejected",
  "blog_review",
  "blog_submitted_review",
  "blog_published",
  "member_joined",
  "member_removed",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
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
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  publicationId: integer("publicationId").references(() => publication.id, {
    onDelete: "set null",
  }),
  masterId: integer("masterId").references(() => blog.id, {
    onDelete: "set null",
  }), // Reference for draft copies of published articles
  categories: text("categories").array(),
  status: blogStatusEnum("status").notNull().default("draft"),
  published: boolean("published").notNull().default(false),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  readTime: integer("readTime"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const comment = pgTable("comment", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  blogId: integer("blogId")
    .notNull()
    .references(() => blog.id, { onDelete: "cascade" }),
  authorId: text("authorId").references(() => user.id, { onDelete: "cascade" }),
  guestName: text("guestName"),
  guestEmail: text("guestEmail"),
  parentId: integer("parentId").references(() => comment.id, {
    onDelete: "cascade",
  }),
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
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const publicationMember = pgTable("publication_member", {
  id: serial("id").primaryKey(),
  publicationId: integer("publicationId")
    .notNull()
    .references(() => publication.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull().default("author"),
  invitedBy: text("invitedBy").references(() => user.id),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const invitation = pgTable("invitation", {
  id: serial("id").primaryKey(),
  publicationId: integer("publicationId")
    .notNull()
    .references(() => publication.id, { onDelete: "cascade" }),
  inviterId: text("inviterId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: memberRoleEnum("role").notNull().default("author"),
  token: text("token").notNull().unique(),
  status: invitationStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const notification = pgTable("notification", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedUserId: text("relatedUserId").references(() => user.id, {
    onDelete: "cascade",
  }),
  relatedBlogId: integer("relatedBlogId").references(() => blog.id, {
    onDelete: "cascade",
  }),
  relatedPublicationId: integer("relatedPublicationId").references(
    () => publication.id,
    { onDelete: "cascade" },
  ),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const blogView = pgTable("blog_view", {
  id: serial("id").primaryKey(),
  blogId: integer("blogId")
    .notNull()
    .references(() => blog.id, { onDelete: "cascade" }),
  viewerIdentifier: text("viewerIdentifier").notNull(), // IP address or user ID
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const blogShare = pgTable("blog_share", {
  id: serial("id").primaryKey(),
  blogId: integer("blogId")
    .notNull()
    .references(() => blog.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // twitter, facebook, linkedin, copy
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
