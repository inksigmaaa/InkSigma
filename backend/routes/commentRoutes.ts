// routes/commentRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { comment, user, blog } from "../models/schema.js";
import { eq, desc, count, inArray, asc } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import { validate } from "../middleware/validate.js";
import * as generalValidator from "../validators/generalValidator.js";
import logger from "../utils/logger.js";

const router = express.Router();

const buildCommentSelect = () => ({
  id: comment.id,
  content: comment.content,
  blogId: comment.blogId,
  authorId: comment.authorId,
  guestName: comment.guestName,
  // guestEmail intentionally omitted: it is guest PII and must not be exposed
  // through the public comment read (GET /api/comments/blog/:blogId).
  parentId: comment.parentId,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  author: {
    id: user.id,
    name: user.name,
    image: user.image,
    username: user.username,
  },
});

// Optional auth - sets req.user if authenticated, doesn't require it
const optionalAuth = async (req, res, next) => {
  req.user = null; // Default to no user

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      req.user = session.user;
      logger.info(`[COMMENT] Authenticated user: ${req.user.id}`);
    } else {
      logger.info(`[COMMENT] No session - guest user`);
    }
  } catch (error) {
    // Not authenticated - that's fine for optional auth
    logger.info("[COMMENT] Auth check failed (guest):");
  }

  next();
};

// GET /api/comments/blog/:blogId - Get all comments for a blog
router.get("/blog/:blogId", async (req, res) => {
  try {
    const { blogId } = req.params;

    logger.info(`[COMMENT] GET /blog/:blogId called with blogId: ${blogId}`);

    // Verify blog exists
    const [blogExists] = await db
      .select({ id: blog.id })
      .from(blog)
      .where(eq(blog.id, parseInt(blogId)));

    if (!blogExists) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const commentRows = await db
      .select(buildCommentSelect())
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.blogId, parseInt(blogId)))
      .orderBy(asc(comment.createdAt));

    const commentsById = new Map();
    const rootComments = [];

    for (const row of commentRows) {
      const hydratedComment = { ...row, replies: [] };
      commentsById.set(row.id, hydratedComment);

      if (row.parentId == null) {
        rootComments.push(hydratedComment);
        continue;
      }

      const parentComment = commentsById.get(row.parentId);
      if (parentComment) {
        parentComment.replies.push(hydratedComment);
      }
    }

    const commentsWithReplies = rootComments.sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );

    logger.info(
      `[COMMENT] Returning ${commentsWithReplies.length} comments for blog ${blogId}`,
    );
    res.json(commentsWithReplies);
  } catch (error) {
    logger.error(error, "Error fetching comments:");
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/comments - Create a new comment (allows anonymous)
router.post(
  "/",
  optionalAuth,
  validate(generalValidator.commentSchema),
  async (req, res) => {
    logger.info("[COMMENT] ===== POST /api/comments START =====");

    try {
      const { blogId, content, parentId, guestName, guestEmail } = req.body;

      logger.info(
        `[COMMENT] Request body: ${JSON.stringify({
          blogId,
          contentLength: content?.length,
          parentId,
          guestName,
        })}`,
      );

      // Validation checks
      if (!blogId || !content) {
        logger.info("[COMMENT] Validation failed: missing blogId or content");
        return res
          .status(400)
          .json({ error: "Blog ID and content are required" });
      }

      const parsedBlogId = parseInt(blogId);
      if (isNaN(parsedBlogId)) {
        logger.info("[COMMENT] Validation failed: invalid blogId");
        return res.status(400).json({ error: "Invalid blog ID" });
      }

      if (content.trim().length === 0) {
        logger.info("[COMMENT] Validation failed: empty content");
        return res
          .status(400)
          .json({ error: "Comment content cannot be empty" });
      }

      if (content.length > 2000) {
        logger.info("[COMMENT] Validation failed: content too long");
        return res
          .status(400)
          .json({ error: "Comment content too long (max 2000 characters)" });
      }

      if (!req.user && (!guestName || guestName.trim().length === 0)) {
        logger.info("[COMMENT] Validation failed: guest without name");
        return res
          .status(400)
          .json({ error: "Name is required for guest comments" });
      }

      logger.info("[COMMENT] All validations passed");

      // Check blog exists
      logger.info("[COMMENT] Checking if blog exists with ID:");
      const blogCheckResult = await db
        .select({ id: blog.id })
        .from(blog)
        .where(eq(blog.id, parsedBlogId));

      logger.info(
        `[COMMENT] Blog check result: ${JSON.stringify(blogCheckResult)}`,
      );

      if (!blogCheckResult || blogCheckResult.length === 0) {
        logger.info(`[COMMENT] Blog not found.`);
        return res.status(404).json({ error: "Blog not found" });
      }

      logger.info("[COMMENT] Blog exists, proceeding with comment creation");

      // Build comment data - let database handle timestamps
      const commentData: any = {
        content: content.trim(),
        blogId: parsedBlogId,
        parentId: parentId ? parseInt(parentId) : null,
      };

      if (req.user) {
        commentData.authorId = req.user.id;
      } else {
        commentData.guestName = guestName.trim();
        commentData.guestEmail = guestEmail?.trim() || null;
      }

      logger.info(
        `[COMMENT] Comment data prepared: ${JSON.stringify({
          ...commentData,
          content: commentData.content.substring(0, 30) + "...",
        })}`,
      );

      // Insert comment
      logger.info("[COMMENT] Inserting comment into database");
      const insertResult = await db
        .insert(comment)
        .values(commentData)
        .returning();

      logger.info("[COMMENT] Insert result:");

      if (!insertResult || (insertResult as any[]).length === 0) {
        logger.info(`[COMMENT] Insert returned empty result.`);
        return res
          .status(500)
          .json({ error: "Failed to create comment - no result returned" });
      }

      const newComment = insertResult[0];
      logger.info("[COMMENT] Comment created with ID:");

      // Prepare response
      let responseData;
      if (req.user) {
        logger.info("[COMMENT] Fetching comment with author info");
        const fetchResult = await db
          .select({
            id: comment.id,
            content: comment.content,
            blogId: comment.blogId,
            authorId: comment.authorId,
            guestName: comment.guestName,
            parentId: comment.parentId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            author: {
              id: user.id,
              name: user.name,
              image: user.image,
              username: user.username,
            },
          })
          .from(comment)
          .leftJoin(user, eq(comment.authorId, user.id))
          .where(eq(comment.id, newComment.id));

        responseData = fetchResult[0] || newComment;
      } else {
        responseData = { ...newComment, author: null };
      }

      logger.info(
        `[COMMENT] Sending response: ${JSON.stringify({
          id: responseData.id,
          contentLength: responseData.content?.length,
        })}`,
      );
      res.status(201).json({ ...responseData, replies: [] });
      logger.info("[COMMENT] ===== POST /api/comments SUCCESS =====");
    } catch (error) {
      logger.error(error, "[COMMENT] ===== ERROR CAUGHT =====");

      if (!res.headersSent) {
        logger.info("[COMMENT] Sending error response");
        res.status(500).json({
          error: "Failed to create comment",
          message: error?.message || "Unknown error",
          code: error?.code || "UNKNOWN",
        });
      } else {
        logger.info(
          "[COMMENT] Headers already sent, cannot send error response",
        );
      }
    }
  },
);

// PUT /api/comments/:id - Update a comment (only for logged in users on their own comments)
router.put(
  "/:id",
  optionalAuth,
  validate(generalValidator.byIdParam),
  validate(generalValidator.commentSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!req.user) {
        return res
          .status(401)
          .json({ error: "Must be logged in to edit comments" });
      }

      if (!content || content.trim().length === 0) {
        return res
          .status(400)
          .json({ error: "Comment content cannot be empty" });
      }

      if (content.length > 2000) {
        return res
          .status(400)
          .json({ error: "Comment content too long (max 2000 characters)" });
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
        return res
          .status(403)
          .json({ error: "Not authorized to edit this comment" });
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
          parentId: comment.parentId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          author: {
            id: user.id,
            name: user.name,
            image: user.image,
            username: user.username,
          },
        })
        .from(comment)
        .leftJoin(user, eq(comment.authorId, user.id))
        .where(eq(comment.id, updatedComment.id));

      res.json(commentWithAuthor);
    } catch (error) {
      logger.error("Error updating comment:");
      res.status(500).json({ error: "Failed to update comment" });
    }
  },
);

// DELETE /api/comments/:id - Delete a comment (only for logged in users on their own comments)
router.delete(
  "/:id",
  optionalAuth,
  validate(generalValidator.byIdParam),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res
          .status(401)
          .json({ error: "Must be logged in to delete comments" });
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
        return res
          .status(403)
          .json({ error: "Not authorized to delete this comment" });
      }

      // Delete comment (cascade will handle replies)
      await db.delete(comment).where(eq(comment.id, parseInt(id)));

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      logger.error(error, "Error deleting comment:");
      res.status(500).json({ error: "Failed to delete comment" });
    }
  },
);

// GET /api/comments/count/:blogId - Get comment count for a blog
router.get(
  "/count/:blogId",
  validate(generalValidator.byBlogIdParam),
  async (req, res) => {
    try {
      const { blogId } = req.params;

      const [result] = await db
        .select({ count: count() })
        .from(comment)
        .where(eq(comment.blogId, parseInt(blogId)));

      res.json({ count: Number(result?.count || 0) });
    } catch (error) {
      logger.error(error, "Error fetching comment count:");
      res.status(500).json({ error: "Failed to fetch comment count" });
    }
  },
);

// POST /api/comments/counts - Get comment counts for multiple blogs
router.post("/counts", async (req, res) => {
  try {
    const { blogIds } = req.body;

    if (!blogIds || !Array.isArray(blogIds)) {
      return res.status(400).json({ error: "blogIds array is required" });
    }

    if (blogIds.length > 200) {
      return res
        .status(400)
        .json({ error: "Too many blogIds (max 200 per request)" });
    }

    const normalizedBlogIds = blogIds
      .map((blogId) => Number.parseInt(String(blogId), 10))
      .filter((blogId) => Number.isFinite(blogId));
    const counts = Object.fromEntries(
      normalizedBlogIds.map((blogId) => [String(blogId), 0]),
    );

    if (normalizedBlogIds.length > 0) {
      const results = await db
        .select({ blogId: comment.blogId, count: count() })
        .from(comment)
        .where(inArray(comment.blogId, normalizedBlogIds))
        .groupBy(comment.blogId);

      for (const row of results) {
        counts[String(row.blogId)] = Number(row.count || 0);
      }
    }

    res.json(counts);
  } catch (error) {
    logger.error(error, "Error fetching comment counts:");
    res.status(500).json({ error: "Failed to fetch comment counts" });
  }
});

export default router;
