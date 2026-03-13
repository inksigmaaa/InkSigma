import {
    pgTable,
    text,
    timestamp,
    boolean,
    serial,
    integer,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expiresAt").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("createdAt").notNull().defaultNow(),
        updatedAt: timestamp("updatedAt").notNull().defaultNow(),
        ipAddress: text("ipAddress"),
        userAgent: text("userAgent"),
        userId: text("userId")
            .notNull()
            .references(() => user.id),
    },
    (table) => ({
        userIdIdx: index("session_user_id_idx").on(table.userId),
    })
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("accountId").notNull(),
        providerId: text("providerId").notNull(),
        userId: text("userId")
            .notNull()
            .references(() => user.id),
        accessToken: text("accessToken"),
        refreshToken: text("refreshToken"),
        idToken: text("idToken"),
        accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
        refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("createdAt").notNull().defaultNow(),
        updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    },
    (table) => ({
        userIdIdx: index("account_user_id_idx").on(table.userId),
    })
);

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const publication = pgTable(
    "publication",
    {
        id: serial("id").primaryKey(),
        name: text("name").notNull(),
        subdomain: text("subdomain").notNull().unique(),
        description: text("description"),
        image: text("image"),
        userId: text("userId")
            .notNull()
            .references(() => user.id)
            .unique(),
        createdAt: timestamp("createdAt").notNull().defaultNow(),
        updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    },
    (table) => ({
        ownerIdx: index("publication_user_id_idx").on(table.userId),
    })
);

export const blog = pgTable(
    "blog",
    {
        id: serial("id").primaryKey(),
        publicationId: integer("publicationId")
            .notNull()
            .references(() => publication.id),
        slug: text("slug").notNull(),
        title: text("title").notNull(),
        description: text("description").notNull(),
        content: text("content").notNull(),
        image: text("image"),
        status: text("status").notNull().default("draft"),
        authorId: text("authorId")
            .notNull()
            .references(() => user.id),
        categories: text("categories").array(),
        published: boolean("published").notNull().default(false),
        publishedAt: timestamp("publishedAt"),
        scheduledFor: timestamp("scheduledFor"),
        createdAt: timestamp("createdAt").notNull().defaultNow(),
        updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    },
    (table) => ({
        publicationSlugUnique: uniqueIndex("blog_publication_slug_unique").on(
            table.publicationId,
            table.slug
        ),
        publicationIdx: index("blog_publication_id_idx").on(table.publicationId),
        authorIdx: index("blog_author_id_idx").on(table.authorId),
        publicationStatusIdx: index("blog_publication_status_created_idx").on(
            table.publicationId,
            table.status,
            table.createdAt
        ),
    })
);

export const comment = pgTable(
    "comment",
    {
        id: serial("id").primaryKey(),
        publicationId: integer("publicationId")
            .notNull()
            .references(() => publication.id),
        content: text("content").notNull(),
        blogId: integer("blogId")
            .notNull()
            .references(() => blog.id),
        authorId: text("authorId")
            .notNull()
            .references(() => user.id),
        parentId: integer("parentId"),
        createdAt: timestamp("createdAt").notNull().defaultNow(),
        updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    },
    (table) => ({
        publicationIdx: index("comment_publication_id_idx").on(table.publicationId),
        blogIdx: index("comment_blog_id_idx").on(table.blogId),
        authorIdx: index("comment_author_id_idx").on(table.authorId),
        parentIdx: index("comment_parent_id_idx").on(table.parentId),
    })
);
