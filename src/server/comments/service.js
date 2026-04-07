import "server-only";

import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { blog, comment, user } from "@/db/schema";
import { AuthorizationError } from "@/server/auth/session";

export async function getBlogCommentContext(blogId) {
    const blogs = await db
        .select({
            id: blog.id,
            publicationId: blog.publicationId,
            status: blog.status,
        })
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    return blogs[0] ?? null;
}

export async function listCommentsForBlog(blogId) {
    const rows = await db
        .select({
            authorId: comment.authorId,
            authorImage: user.image,
            authorName: user.name,
            blogId: comment.blogId,
            content: comment.content,
            createdAt: comment.createdAt,
            id: comment.id,
            parentId: comment.parentId,
        })
        .from(comment)
        .leftJoin(user, eq(comment.authorId, user.id))
        .where(eq(comment.blogId, blogId));

    const commentsById = new Map();
    const topLevelComments = [];

    for (const row of rows) {
        commentsById.set(row.id, {
            author: {
                avatar: row.authorImage,
                name: row.authorName ?? "Anonymous",
            },
            authorId: row.authorId,
            blogId: row.blogId,
            content: row.content,
            createdAt: row.createdAt,
            id: row.id,
            replies: [],
        });
    }

    for (const row of rows) {
        const mappedComment = commentsById.get(row.id);

        if (row.parentId) {
            const parent = commentsById.get(row.parentId);
            parent?.replies.push(mappedComment);
            continue;
        }

        topLevelComments.push(mappedComment);
    }

    return topLevelComments.sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
}

export async function createCommentForBlog({ authorId, blogId, content, parentId }) {
    const blogContext = await getBlogCommentContext(blogId);

    if (!blogContext || blogContext.status !== "published") {
        throw new Error("Blog not found");
    }

    const createdComments = await db
        .insert(comment)
        .values({
            authorId,
            blogId,
            content,
            parentId: parentId ?? null,
            publicationId: blogContext.publicationId,
        })
        .returning();

    return createdComments[0];
}

export async function deleteCommentForUser({ commentId, userId }) {
    const comments = await db
        .select({
            authorId: comment.authorId,
            id: comment.id,
        })
        .from(comment)
        .where(eq(comment.id, commentId))
        .limit(1);

    const commentRecord = comments[0] ?? null;

    if (!commentRecord) {
        return false;
    }

    if (commentRecord.authorId !== userId) {
        throw new AuthorizationError(403, "Forbidden");
    }

    await db
        .delete(comment)
        .where(or(eq(comment.id, commentId), eq(comment.parentId, commentId)));

    return true;
}
