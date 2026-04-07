import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { blog, user } from "@/db/schema";

function mapPublishedBlog(row) {
    return {
        author: {
            avatar: row.authorImage,
            name: row.authorName ?? "Anonymous",
        },
        categories: row.categories ?? [],
        content: row.content,
        createdAt: row.createdAt,
        description: row.description,
        id: row.id,
        publishedAt: row.publishedAt,
        slug: row.slug,
        thumbnail: row.image,
        title: row.title,
    };
}

export async function listPublishedBlogsForPublication(publicationId) {
    const rows = await db
        .select({
            authorImage: user.image,
            authorName: user.name,
            categories: blog.categories,
            content: blog.content,
            createdAt: blog.createdAt,
            description: blog.description,
            id: blog.id,
            image: blog.image,
            publishedAt: blog.publishedAt,
            slug: blog.slug,
            title: blog.title,
        })
        .from(blog)
        .leftJoin(user, eq(blog.authorId, user.id))
        .where(and(eq(blog.publicationId, publicationId), eq(blog.status, "published")))
        .orderBy(desc(blog.publishedAt), desc(blog.createdAt));

    return rows.map(mapPublishedBlog);
}

export async function getPublishedBlogBySlug(publicationId, slug) {
    const rows = await db
        .select({
            authorImage: user.image,
            authorName: user.name,
            categories: blog.categories,
            content: blog.content,
            createdAt: blog.createdAt,
            description: blog.description,
            id: blog.id,
            image: blog.image,
            publishedAt: blog.publishedAt,
            slug: blog.slug,
            title: blog.title,
        })
        .from(blog)
        .leftJoin(user, eq(blog.authorId, user.id))
        .where(
            and(
                eq(blog.publicationId, publicationId),
                eq(blog.slug, slug),
                eq(blog.status, "published")
            )
        )
        .limit(1);

    return rows[0] ? mapPublishedBlog(rows[0]) : null;
}
