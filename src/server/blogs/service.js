import "server-only";

import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import { blog } from "@/db/schema";
import {
    BLOG_STATUSES,
    BLOG_STATUS_VALUES,
    resolveBlogState,
    slugifyTitle,
} from "@/lib/blogs/core";

function normalizeCategories(categories) {
    if (!Array.isArray(categories)) {
        return [];
    }

    return categories
        .map((category) => String(category).trim())
        .filter(Boolean);
}


export async function generateUniquePublicationSlug(publicationId, title, blogId) {
    const baseSlug = slugifyTitle(title);
    let suffix = 0;

    while (true) {
        const candidateSlug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;
        const conditions = [
            eq(blog.publicationId, publicationId),
            eq(blog.slug, candidateSlug),
        ];

        if (blogId) {
            conditions.push(ne(blog.id, blogId));
        }

        const existingBlogs = await db
            .select({ id: blog.id })
            .from(blog)
            .where(and(...conditions))
            .limit(1);

        if (existingBlogs.length === 0) {
            return candidateSlug;
        }

        suffix += 1;
    }
}

export async function listBlogsForPublication(publicationId, status) {
    const conditions = [eq(blog.publicationId, publicationId)];

    if (status && status !== "all") {
        conditions.push(eq(blog.status, status));
    }

    return db
        .select()
        .from(blog)
        .where(and(...conditions))
        .orderBy(desc(blog.updatedAt), desc(blog.createdAt));
}

export async function getBlogForPublication(publicationId, blogId) {
    const blogs = await db
        .select()
        .from(blog)
        .where(and(eq(blog.publicationId, publicationId), eq(blog.id, blogId)))
        .limit(1);

    return blogs[0] ?? null;
}

export async function createBlogForPublication({
    action,
    authorId,
    publicationId,
    title,
    description,
    content,
    image,
    categories,
    scheduledFor,
}) {
    const slug = await generateUniquePublicationSlug(publicationId, title);
    const resolvedState = resolveBlogState(action, scheduledFor);

    const createdBlogs = await db
        .insert(blog)
        .values({
            authorId,
            categories: normalizeCategories(categories),
            content,
            description,
            image: image ?? null,
            publicationId,
            slug,
            title,
            ...resolvedState,
        })
        .returning();

    return createdBlogs[0];
}

export async function updateBlogForPublication({
    action,
    blogId,
    categories,
    content,
    description,
    image,
    publicationId,
    scheduledFor,
    title,
}) {
    const slug = await generateUniquePublicationSlug(publicationId, title, blogId);
    const resolvedState = resolveBlogState(action, scheduledFor);

    const updatedBlogs = await db
        .update(blog)
        .set({
            categories: normalizeCategories(categories),
            content,
            description,
            image: image ?? null,
            scheduledFor: resolvedState.scheduledFor,
            slug,
            status: resolvedState.status,
            published: resolvedState.published,
            publishedAt: resolvedState.publishedAt,
            title,
            updatedAt: new Date(),
        })
        .where(and(eq(blog.publicationId, publicationId), eq(blog.id, blogId)))
        .returning();

    return updatedBlogs[0] ?? null;
}

export async function bulkUpdateBlogStatus({
    action,
    blogIds,
    publicationId,
}) {
    const resolvedState = resolveBlogState(action);

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
        return [];
    }

    return db
        .update(blog)
        .set({
            published: resolvedState.published,
            publishedAt: resolvedState.publishedAt,
            scheduledFor: resolvedState.scheduledFor,
            status: resolvedState.status,
            updatedAt: new Date(),
        })
        .where(and(eq(blog.publicationId, publicationId), inArray(blog.id, blogIds)))
        .returning();
}

export async function deleteBlogsForPublication({ blogIds, publicationId }) {
    if (!Array.isArray(blogIds) || blogIds.length === 0) {
        return [];
    }

    return db
        .delete(blog)
        .where(and(eq(blog.publicationId, publicationId), inArray(blog.id, blogIds)))
        .returning({ id: blog.id });
}
