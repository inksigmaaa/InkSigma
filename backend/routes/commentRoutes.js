// routes/commentRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { comment, user, blog } from "../models/schema.js";
import { eq, desc, and, isNull } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";

const router = express.Router();

// Optional auth - sets req.user if authenticated, doesn't require it
const optionalAuth = async (req, res, next) => {
    req.user = null; // Default to no user
    
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        
        if (session?.user) {
            req.user = session.user;
            console.log('[COMMENT] Authenticated user:', req.user.id);
        } else {
            console.log('[COMMENT] No session - guest user');
        }
    } catch (error) {
        // Not authenticated - that's fine for optional auth
        console.log('[COMMENT] Auth check failed (guest):', error.message);
    }
    
    next();
};

// GET /api/comments/blog/:blogId - Get all comments for a blog
router.get("/blog/:blogId", async (req, res) => {
    try {
        const { blogId } = req.params;

        // Verify blog exists
        const [blogExists] = await db
            .select({ id: blog.id })
            .from(blog)
            .where(eq(blog.id, parseInt(blogId)));

        if (!blogExists) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // Get all top-level comments (no parentId)
        const comments = await db
            .select({
                id: comment.id,
                content: comment.content,
                blogId: comment.blogId,
                authorId: comment.authorId,
                guestName: comment.guestName,
                guestEmail: comment.guestEmail,
                parentId: comment.parentId,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    image: user.image,
                    username: user.username
                }
            })
            .from(comment)
            .leftJoin(user, eq(comment.authorId, user.id))
            .where(and(
                eq(comment.blogId, parseInt(blogId)),
                isNull(comment.parentId)
            ))
            .orderBy(desc(comment.createdAt));

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (c) => {
                const replies = await db
                    .select({
                        id: comment.id,
                        content: comment.content,
                        blogId: comment.blogId,
                        authorId: comment.authorId,
                        guestName: comment.guestName,
                        guestEmail: comment.guestEmail,
                        parentId: comment.parentId,
                        createdAt: comment.createdAt,
                        updatedAt: comment.updatedAt,
                        author: {
                            id: user.id,
                            name: user.name,
                            image: user.image,
                            username: user.username
                        }
                    })
                    .from(comment)
                    .leftJoin(user, eq(comment.authorId, user.id))
                    .where(eq(comment.parentId, c.id))
                    .orderBy(comment.createdAt);

                return { ...c, replies };
            })
        );

        res.json(commentsWithReplies);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// POST /api/comments - Create a new comment (allows anonymous)
router.post("/", optionalAuth, async (req, res) => {
    try {
        const { blogId, content, parentId, guestName, guestEmail } = req.body;

        if (!blogId || !content) {
            return res.status(400).json({ error: "Blog ID and content are required" });
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ error: "Comment content cannot be empty" });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: "Comment content too long (max 2000 characters)" });
        }

        // If not logged in, require guest name
        if (!req.user && (!guestName || guestName.trim().length === 0)) {
            return res.status(400).json({ error: "Name is required for guest comments" });
        }

        // Verify blog exists
        const [blogExists] = await db
            .select({ id: blog.id })
            .from(blog)
            .where(eq(blog.id, parseInt(blogId)));

        if (!blogExists) {
            return res.status(404).json({ error: "Blog not found" });
        }

        // If parentId provided, verify parent comment exists
        if (parentId) {
            const [parentExists] = await db
                .select({ id: comment.id })
                .from(comment)
                .where(eq(comment.id, parseInt(parentId)));

            if (!parentExists) {
                return res.status(404).json({ error: "Parent comment not found" });
            }
        }

        const commentData = {
            content: content.trim(),
            blogId: parseInt(blogId),
            parentId: parentId ? parseInt(parentId) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Set author info based on authentication
        if (req.user) {
            commentData.authorId = req.user.id;
        } else {
            commentData.guestName = guestName.trim();
            commentData.guestEmail = guestEmail?.trim() || null;
        }

        const [newComment] = await db
            .insert(comment)
            .values(commentData)
            .returning();

        // Fetch the comment with author info if logged in
        let commentWithAuthor;
        if (req.user) {
            [commentWithAuthor] = await db
                .select({
                    id: comment.id,
                    content: comment.content,
                    blogId: comment.blogId,
                    authorId: comment.authorId,
                    guestName: comment.guestName,
                    guestEmail: comment.guestEmail,
                    parentId: comment.parentId,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt,
                    author: {
                        id: user.id,
                        name: user.name,
                        image: user.image,
                        username: user.username
                    }
                })
                .from(comment)
                .leftJoin(user, eq(comment.authorId, user.id))
                .where(eq(comment.id, newComment.id));
        } else {
            commentWithAuthor = {
                ...newComment,
                author: null
            };
        }

        res.status(201).json({ ...commentWithAuthor, replies: [] });
    } catch (error) {
        console.error("Error creating comment:", error);
        console.error("Error details:", error.message);
        res.status(500).json({ error: "Failed to create comment", details: error.message });
    }
});

// PUT /api/comments/:id - Update a comment (only for logged in users on their own comments)
router.put("/:id", optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: "Must be logged in to edit comments" });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: "Comment content cannot be empty" });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: "Comment content too long (max 2000 characters)" });
        }

        // Check if comment exists and user owns it
        const [existingComment] = await db
            .select()
            .from(comment)
            .where(eq(comment.id, parseInt(id)));

        if (!existingComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (existingComment.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to edit this comment" });
        }

        const [updatedComment] = await db
            .update(comment)
            .set({
                content: content.trim(),
                updatedAt: new Date(),
            })
            .where(eq(comment.id, parseInt(id)))
            .returning();

        // Fetch with author info
        const [commentWithAuthor] = await db
            .select({
                id: comment.id,
                content: comment.content,
                blogId: comment.blogId,
                authorId: comment.authorId,
                guestName: comment.guestName,
                guestEmail: comment.guestEmail,
                parentId: comment.parentId,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: {
                    id: user.id,
                    name: user.name,
                    image: user.image,
                    username: user.username
                }
            })
            .from(comment)
            .leftJoin(user, eq(comment.authorId, user.id))
            .where(eq(comment.id, updatedComment.id));

        res.json(commentWithAuthor);
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ error: "Failed to update comment" });
    }
});

// DELETE /api/comments/:id - Delete a comment (only for logged in users on their own comments)
router.delete("/:id", optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({ error: "Must be logged in to delete comments" });
        }

        // Check if comment exists and user owns it
        const [existingComment] = await db
            .select()
            .from(comment)
            .where(eq(comment.id, parseInt(id)));

        if (!existingComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (existingComment.authorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this comment" });
        }

        // Delete comment (cascade will handle replies)
        await db
            .delete(comment)
            .where(eq(comment.id, parseInt(id)));

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Failed to delete comment" });
    }
});

// GET /api/comments/count/:blogId - Get comment count for a blog
router.get("/count/:blogId", async (req, res) => {
    try {
        const { blogId } = req.params;

        const comments = await db
            .select({ id: comment.id })
            .from(comment)
            .where(eq(comment.blogId, parseInt(blogId)));

        res.json({ count: comments.length });
    } catch (error) {
        console.error("Error fetching comment count:", error);
        res.status(500).json({ error: "Failed to fetch comment count" });
    }
});

// POST /api/comments/counts - Get comment counts for multiple blogs
router.post("/counts", async (req, res) => {
    try {
        const { blogIds } = req.body;

        if (!blogIds || !Array.isArray(blogIds)) {
            return res.status(400).json({ error: "blogIds array is required" });
        }

        const counts = {};
        
        for (const blogId of blogIds) {
            const comments = await db
                .select({ id: comment.id })
                .from(comment)
                .where(eq(comment.blogId, parseInt(blogId)));
            
            counts[blogId] = comments.length;
        }

        res.json(counts);
    } catch (error) {
        console.error("Error fetching comment counts:", error);
        res.status(500).json({ error: "Failed to fetch comment counts" });
    }
});

export default router;
