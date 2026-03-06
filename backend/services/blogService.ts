import { db } from "../config/database.js";
import {
  blog,
  user,
  publication,
  publicationMember,
  comment,
  blogShare,
} from "../models/schema.js";
import {
  eq,
  ne,
  desc,
  and,
  or,
  ilike,
  count,
  isNull,
  inArray,
  sql,
} from "drizzle-orm";
import fs from "fs";
import notificationService from "./notificationService.js";
import schedulerService from "./schedulerService.js";
import { getBlogStats } from "./viewTrackingService.js";
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

interface BlogInsertData {
  slug: string;
  title: string;
  description: string;
  content: string;
  categories?: string[];
  status?: string;
  published?: boolean;
  authorId: string;
  publicationId?: number | null;
  masterId?: number | null;
  scheduledAt?: Date | null;
  image?: string | null;
  readTime?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BlogUpdateData {
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  categories?: string[];
  status?: string;
  published?: boolean;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  image?: string | null;
  publicationId?: number | null;
  masterId?: number | null;
  readTime?: number | null;
  updatedAt?: Date;
}

const DEFAULT_DRAFT_TITLE = "[Untitled]";

const LIGHT_BLOG_SELECT = {
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  description: blog.description,
  image: blog.image,
  publicationId: blog.publicationId,
  categories: blog.categories,
  status: blog.status,
  published: blog.published,
  scheduledAt: blog.scheduledAt,
  createdAt: blog.createdAt,
  updatedAt: blog.updatedAt,
  authorId: blog.authorId,
  masterId: blog.masterId,
  author: {
    id: user.id,
    name: user.name,
    image: user.image,
    username: user.username,
  },
};

const FULL_BLOG_SELECT = {
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  description: blog.description,
  content: blog.content,
  image: blog.image,
  categories: blog.categories,
  status: blog.status,
  published: blog.published,
  publicationId: blog.publicationId,
  scheduledAt: blog.scheduledAt,
  createdAt: blog.createdAt,
  updatedAt: blog.updatedAt,
  authorId: blog.authorId,
  masterId: blog.masterId,
  author: {
    id: user.id,
    name: user.name,
    image: user.image,
    username: user.username,
  },
};

const runInBackground = (label, task) => {
  setImmediate(async () => {
    try {
      await task();
    } catch (error) {
      logger.error(error, `[Background Task Error: ${label}]`);
    }
  });
};

class BlogService {
  // Helper function to check if user can modify a blog
  async canUserModifyBlog(userId, blogAuthorId, blogPublicationId) {
    if (!userId || !blogAuthorId) return false;

    if (userId === blogAuthorId) {
      return true;
    }

    if (!blogPublicationId) {
      return false;
    }

    const [[pub], [membership]] = await Promise.all([
      db.select({ id: publication.id, ownerId: publication.userId })
        .from(publication)
        .where(eq(publication.id, blogPublicationId))
        .limit(1),
      db.select({ role: publicationMember.role })
        .from(publicationMember)
        .where(
          and(
            eq(publicationMember.publicationId, blogPublicationId),
            eq(publicationMember.userId, userId),
          ),
        )
        .limit(1),
    ]);

    if (!pub) {
      return false;
    }

    if (pub.ownerId === userId) {
      return true;
    }

    return membership?.role === "admin" || membership?.role === "editor";
  }

  // Helper function to generate slug from title
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  // Helper function to ensure unique slug
  async ensureUniqueSlug(baseSlug, excludeId = null) {
    const normalizedBaseSlug =
      typeof baseSlug === "string" && baseSlug.trim()
        ? baseSlug.trim()
        : this.generateSlug(DEFAULT_DRAFT_TITLE);
    let slug = normalizedBaseSlug;
    let counter = 1;

    while (true) {
      const conditions = [eq(blog.slug, slug)];
      if (excludeId != null) {
        conditions.push(ne(blog.id, excludeId));
      }

      const [existing] = await db
        .select({ id: blog.id })
        .from(blog)
        .where(and(...conditions));
      if (!existing) break;

      slug = `${normalizedBaseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Helper function to sync status and published fields according to strict rules
  syncStatusAndPublished(status) {
    if (
      ![
        BLOG_STATUS.DRAFT,
        BLOG_STATUS.PUBLISHED,
        BLOG_STATUS.UNPUBLISHED,
        BLOG_STATUS.TRASH,
        BLOG_STATUS.SCHEDULED,
        BLOG_STATUS.REVIEW,
      ].includes(status)
    ) {
      throw new Error(
        `Invalid status: ${status}. Must be BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.UNPUBLISHED, BLOG_STATUS.TRASH, BLOG_STATUS.SCHEDULED, or BLOG_STATUS.REVIEW`,
      );
    }

    return {
      status,
      published: status === BLOG_STATUS.PUBLISHED,
    };
  }

  async notifyReviewSubmission({
    publicationId,
    authorId,
    actorId,
    actorName,
    blogId,
  }) {
    if (!publicationId) return;

    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, publicationId));

    if (!pub) return;

    await notificationService.notifyBlogSubmittedForReview({
      authorId,
      publicationName: pub.name,
      blogId,
      publicationId,
    });

    const admins = await db
      .select({ userId: publicationMember.userId })
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, publicationId),
          or(
            eq(publicationMember.role, "admin"),
            eq(publicationMember.role, "editor"),
          ),
        ),
      );

    const recipients = new Set<string>();

    for (const admin of admins) {
      if (admin.userId && admin.userId !== actorId) {
        recipients.add(admin.userId);
      }
    }

    if (pub.userId && pub.userId !== actorId) {
      recipients.add(pub.userId);
    }

    if (recipients.size === 0) return;

    await Promise.allSettled(
      Array.from(recipients).map((recipientId) =>
        notificationService.notifyBlogReview({
          recipientId,
          authorName: actorName || "Author",
          authorId: actorId,
          blogId,
        }),
      ),
    );
  }
  async getAllBlogs(query, currentUserId, tenant) {
    const {
      published,
      status,
      authorId,
      categories,
      search,
      limit = 50,
      offset = 0,
      includeUnpublished,
      includeStats,
    } = query;

    let publicationId = query.publicationId;
    if (tenant?.type === "subdomain" || tenant?.type === "custom-domain") {
      if (!tenant.publication) {
        throw new Error("Publication not found|404");
      }
      publicationId = String(tenant.publication.id);
    }

    let dbQuery = db
      .select(LIGHT_BLOG_SELECT)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id));

    const conditions = [];

    const statusExplicitlyPublished = status === BLOG_STATUS.PUBLISHED;

    if (status !== undefined) {
      conditions.push(eq(blog.status, status));
    } else if (published !== undefined) {
      conditions.push(eq(blog.published, published === "true"));
    } else if (!includeUnpublished || includeUnpublished !== "true") {
      if (currentUserId) {
        conditions.push(
          or(
            eq(blog.status, BLOG_STATUS.PUBLISHED),
            eq(blog.authorId, currentUserId)
          )
        );
      } else {
        conditions.push(eq(blog.status, BLOG_STATUS.PUBLISHED));
      }
    }

    if (authorId) conditions.push(eq(blog.authorId, authorId));

    if (publicationId) {
      if (publicationId === "null") conditions.push(isNull(blog.publicationId));
      else conditions.push(eq(blog.publicationId, parseInt(publicationId)));
    }

    if (search) {
      conditions.push(
        or(
          ilike(blog.title, `%${search}%`),
          ilike(blog.description, `%${search}%`),
        ),
      );
    }

    if (categories) {
      const categoryArray = Array.isArray(categories)
        ? categories
        : [categories];
      const categoryConditions = categoryArray.map((cat) =>
        sql`${blog.categories} @> ${JSON.stringify([cat])}`
      );
      conditions.push(or(...categoryConditions));
    }

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions)) as typeof dbQuery;
    }

    dbQuery = dbQuery.orderBy(desc(blog.createdAt)) as typeof dbQuery;

    let blogs = await dbQuery.limit(parseInt(limit)).offset(parseInt(offset));

    if (includeStats !== "true") {
      return blogs.map((b) => ({
        ...b,
        views: 0,
        comments: 0,
        shares: 0,
        revisits: 0,
      }));
    }

    const blogsToProcess = blogs.slice(0, 50);
    const blogIds = blogsToProcess.map((b) => b.id);
    let statsMap: Record<string, { views: number; shares: number }> = {};
    let commentMap: Record<string, number> = {};

    if (blogIds.length > 0) {
      try {
        statsMap = await getBlogStats(blogIds);
        const commentsResult = await db
          .select({ blogId: comment.blogId, count: count() })
          .from(comment)
          .where(inArray(comment.blogId, blogIds))
          .groupBy(comment.blogId);

        for (const row of commentsResult) {
          commentMap[String(row.blogId)] = Number(row.count) || 0;
        }
      } catch (err) {
        logger.error(err, "Batch stat fetch failed:");
      }
    }

    return blogsToProcess.map((b) => ({
      ...b,
      views: statsMap[String(b.id)]?.views || 0,
      shares: statsMap[String(b.id)]?.shares || 0,
      comments: commentMap[String(b.id)] || 0,
      revisits: 0,
    }));
  }

  async getPublicBlogs(publicationId) {
    return db
      .select(LIGHT_BLOG_SELECT)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(
        and(
          eq(blog.publicationId, publicationId),
          eq(blog.status, BLOG_STATUS.PUBLISHED),
        ),
      )
      .orderBy(desc(blog.publishedAt));
  }

  async getPublicationBlogs(publicationId, query, currentUser) {
    const { status, limit = 50, offset = 0, includeStats } = query;

    const [[pub], memberCheck] = await Promise.all([
      db.select().from(publication).where(eq(publication.id, parseInt(publicationId))),
      !currentUser.id ? Promise.resolve(null) : 
        db.select().from(publicationMember).where(
          and(
            eq(publicationMember.publicationId, parseInt(publicationId)),
            eq(publicationMember.userId, currentUser.id),
          ),
        ).then(m => m[0])
    ]);

    if (!pub) {
      throw new Error("Publication not found|404");
    }

    const isOwner = pub.userId === currentUser.id;
    const isMember = !!memberCheck;

    if (!isOwner && !isMember) {
      throw new Error("Access denied|403");
    }

    const conditions = [eq(blog.publicationId, parseInt(publicationId))];
    if (status) conditions.push(eq(blog.status, status));

    const blogs = await db
      .select(LIGHT_BLOG_SELECT)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(and(...conditions))
      .orderBy(desc(blog.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (includeStats !== "true") {
      return blogs.map((b) => ({
        ...b,
        views: 0,
        comments: 0,
        shares: 0,
        revisits: 0,
      }));
    }

    const blogIds = blogs.map((b) => b.id);
    let statsMap: Record<string, { views: number; shares: number }> = {};
    let commentMap: Record<string, number> = {};

    if (blogIds.length > 0) {
      try {
        statsMap = await getBlogStats(blogIds);
        const commentsResult = await db
          .select({ blogId: comment.blogId, count: count() })
          .from(comment)
          .where(inArray(comment.blogId, blogIds))
          .groupBy(comment.blogId);

        for (const row of commentsResult) {
          commentMap[String(row.blogId)] = Number(row.count) || 0;
        }
      } catch (err) {
        logger.error(err, "Batch stat fetch failed:");
      }
    }

    return blogs.map((b) => ({
      ...b,
      views: statsMap[String(b.id)]?.views || 0,
      shares: statsMap[String(b.id)]?.shares || 0,
      comments: commentMap[String(b.id)] || 0,
      revisits: 0,
    }));
  }

  async getBlogById(id, currentUserId, tenant) {
    const [blogData] = await db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        image: blog.image,
        categories: blog.categories,
        status: blog.status,
        published: blog.published,
        publicationId: blog.publicationId,
        scheduledAt: blog.scheduledAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        authorId: blog.authorId,
        masterId: blog.masterId,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(eq(blog.id, parseInt(id)));

    if (!blogData) throw new Error("Blog not found|404");

    if (tenant?.type === "subdomain" || tenant?.type === "custom-domain") {
      if (!tenant.publication) throw new Error("Blog not found|404");
      if (blogData.publicationId !== tenant.publication.id)
        throw new Error("Blog not found|404");
    }

    if (blogData.status !== BLOG_STATUS.PUBLISHED) {
      if (!currentUserId) throw new Error("Blog not found|404");

      const canView = await this.canUserModifyBlog(
        currentUserId,
        blogData.authorId,
        blogData.publicationId,
      );

      if (!canView) throw new Error("Blog not found|404");
    }

    return blogData;
  }

  async getBlogBySlug(slug, currentUserId, tenant) {
    const [blogData] = await db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        image: blog.image,
        categories: blog.categories,
        status: blog.status,
        published: blog.published,
        publicationId: blog.publicationId,
        scheduledAt: blog.scheduledAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        authorId: blog.authorId,
        masterId: blog.masterId,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
          username: user.username,
        },
      })
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(eq(blog.slug, slug));

    if (!blogData) throw new Error("Blog not found|404");

    if (tenant?.type === "subdomain" || tenant?.type === "custom-domain") {
      if (!tenant.publication) throw new Error("Blog not found|404");
      if (blogData.publicationId !== tenant.publication.id)
        throw new Error("Blog not found|404");
    }

    if (blogData.status !== BLOG_STATUS.PUBLISHED) {
      if (!currentUserId) throw new Error("Blog not found|404");

      const canView = await this.canUserModifyBlog(
        currentUserId,
        blogData.authorId,
        blogData.publicationId,
      );

      if (!canView) throw new Error("Blog not found|404");
    }

    return blogData;
  }
  async createBlog(data, currentUser) {
    const {
      title,
      description,
      content,
      categories,
      published = false,
      status,
      scheduledAt,
      publicationId,
    } = data;

    let parsedScheduledAt: Date | null = null;
    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt);
      if (Number.isNaN(parsedScheduledAt.getTime())) {
        throw new Error("Invalid scheduled time|400");
      }
      if (parsedScheduledAt <= new Date()) {
        throw new Error("Scheduled time must be in the future|400");
      }
    }

    let targetStatus: typeof BLOG_STATUS[keyof typeof BLOG_STATUS] = BLOG_STATUS.DRAFT;
    if (status) targetStatus = status;
    else if (published) targetStatus = BLOG_STATUS.PUBLISHED;
    if (parsedScheduledAt) targetStatus = BLOG_STATUS.SCHEDULED;

    if (targetStatus === BLOG_STATUS.SCHEDULED && !parsedScheduledAt) {
      throw new Error("Scheduled time is required for scheduled status|400");
    }

    const isDraft = targetStatus === BLOG_STATUS.DRAFT;
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const finalTitle = isDraft
      ? normalizedTitle || DEFAULT_DRAFT_TITLE
      : normalizedTitle;

    if (!isDraft) {
      if (!finalTitle || !description || !content) {
        throw new Error("Title, description, and content are required|400");
      }
    }

    if (publicationId) {
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(publicationId)));

      if (!pub) throw new Error("Publication not found|404");

      const isOwner = pub.userId === currentUser.id;
      let isMember = false;

      if (!isOwner) {
        const [member] = await db
          .select()
          .from(publicationMember)
          .where(
            and(
              eq(publicationMember.publicationId, parseInt(publicationId)),
              eq(publicationMember.userId, currentUser.id),
            ),
          );
        isMember = !!member;
      }

      if (!isOwner && !isMember) {
        throw new Error("You don't have access to this publication|403");
      }
    }

    const slug = await this.ensureUniqueSlug(this.generateSlug(finalTitle));
    const syncedFields = this.syncStatusAndPublished(targetStatus);
    const sanitizedContent = content ? sanitizeHtml(content) : content;

    const blogData: BlogInsertData = {
      slug,
      title: finalTitle,
      description,
      content: sanitizedContent,
      categories: categories || [],
      ...syncedFields,
      authorId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (publicationId) blogData.publicationId = parseInt(publicationId);
    if (parsedScheduledAt) blogData.scheduledAt = parsedScheduledAt;

    const result = await db.insert(blog).values(blogData).returning();
    const newBlog = result[0];

    if (newBlog.status === BLOG_STATUS.SCHEDULED && newBlog.scheduledAt) {
      schedulerService.onBlogScheduled(newBlog.id);
    }

    if (newBlog.status === BLOG_STATUS.REVIEW && newBlog.publicationId) {
      runInBackground("create-review-notifications", () =>
        this.notifyReviewSubmission({
          publicationId: newBlog.publicationId,
          authorId: newBlog.authorId,
          actorId: currentUser.id,
          actorName: currentUser.name,
          blogId: newBlog.id,
        }),
      );
    }

    return newBlog;
  }

  async autoSaveDraft(data, currentUser) {
    const { title, description, content, categories, publicationId } = data;

    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";
    const normalizedContent = typeof content === "string" ? content.trim() : "";
    const hasMeaningfulContent =
      normalizedTitle ||
      normalizedDescription ||
      (normalizedContent && normalizedContent !== "<p></p>") ||
      (Array.isArray(categories) && categories.length > 0);

    if (!hasMeaningfulContent) {
      throw new Error("Missing required fields|400");
    }

    const finalTitle = normalizedTitle || DEFAULT_DRAFT_TITLE;
    const slug = await this.ensureUniqueSlug(this.generateSlug(finalTitle));

    const blogData: BlogInsertData = {
      slug,
      title: finalTitle,
      description,
      content,
      categories: categories || [],
      status: BLOG_STATUS.DRAFT,
      published: false,
      authorId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (publicationId) blogData.publicationId = parseInt(publicationId);

    const result = await db.insert(blog).values(blogData).returning();
    const newBlog = result[0];
    return newBlog;
  }

  async createDraftFromPublished(id, data, currentUser) {
    const [originalBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));

    if (!originalBlog) throw new Error("Blog not found|404");

    const authorized = await this.canUserModifyBlog(
      currentUser.id,
      originalBlog.authorId,
      originalBlog.publicationId,
    );
    if (!authorized) throw new Error("Unauthorized|403");

    if (originalBlog.status !== BLOG_STATUS.PUBLISHED) {
      throw new Error("Only published blogs can be edited as drafts|400");
    }

    const [existingDraft] = await db
      .select()
      .from(blog)
      .where(eq(blog.masterId, originalBlog.id));

    if (existingDraft) return existingDraft;

    const { title, description, content, categories, image } = data;

    const draftSlug = await this.ensureUniqueSlug(`${originalBlog.slug}-draft`);
    const sanitizedContent = content ? sanitizeHtml(content) : originalBlog.content;
    const draftData: BlogInsertData = {
      slug: draftSlug,
      title: title || `${originalBlog.title} [Update draft]`,
      description:
        description !== undefined ? description : originalBlog.description,
      content: content !== undefined ? sanitizedContent : originalBlog.content,
      image: image !== undefined ? image : originalBlog.image,
      categories:
        categories !== undefined ? categories : originalBlog.categories,
      status: BLOG_STATUS.DRAFT,
      published: false,
      authorId: originalBlog.authorId,
      publicationId: originalBlog.publicationId,
      masterId: originalBlog.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(blog).values(draftData).returning();
    const newDraft = result[0];
    return newDraft;
  }
  async updateBlog(id, data, currentUser) {
    const {
      title,
      description,
      content,
      categories,
      image,
      published,
      status,
      scheduledAt,
      publicationId,
    } = data;

    let parsedScheduledAt: Date | null = null;
    if (scheduledAt !== undefined) {
      parsedScheduledAt = new Date(scheduledAt);
      if (Number.isNaN(parsedScheduledAt.getTime())) {
        throw new Error("Invalid scheduled time|400");
      }
      if (parsedScheduledAt <= new Date()) {
        throw new Error("Scheduled time must be in the future|400");
      }
    }

    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));
    if (!existingBlog) throw new Error("Blog not found|404");

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) throw new Error("Not authorized to update this blog|403");

    let targetStatusForUpdate = existingBlog.status;
    if (status !== undefined) targetStatusForUpdate = status;
    else if (published !== undefined)
      targetStatusForUpdate = published
        ? BLOG_STATUS.PUBLISHED
        : BLOG_STATUS.DRAFT;
    if (parsedScheduledAt) targetStatusForUpdate = BLOG_STATUS.SCHEDULED;

    if (targetStatusForUpdate === BLOG_STATUS.SCHEDULED) {
      const effectiveScheduledAt = parsedScheduledAt
        ? parsedScheduledAt
        : existingBlog.scheduledAt
          ? new Date(existingBlog.scheduledAt)
          : null;
      if (
        !effectiveScheduledAt ||
        Number.isNaN(effectiveScheduledAt.getTime())
      ) {
        throw new Error("Scheduled time is required for scheduled status|400");
      }
      if (effectiveScheduledAt <= new Date()) {
        throw new Error("Scheduled time must be in the future|400");
      }
    }

    const updateData: BlogUpdateData = { updatedAt: new Date() };
    let slug = existingBlog.slug;

    if (title !== undefined) {
      if (typeof title !== "string")
        throw new Error("Title cannot be empty|400");
      const nextTitle =
        title.trim() === "" && targetStatusForUpdate === BLOG_STATUS.DRAFT
          ? DEFAULT_DRAFT_TITLE
          : title.trim();
      if (!nextTitle) throw new Error("Title cannot be empty|400");
      updateData.title = nextTitle;
      if (nextTitle !== existingBlog.title)
        slug = await this.ensureUniqueSlug(
          this.generateSlug(nextTitle),
          parseInt(id),
        );
    }

    if (description !== undefined && typeof description === "string")
      updateData.description = description.trim();
    if (content !== undefined && typeof content === "string") {
      updateData.content = sanitizeHtml(content.trim());
    }
    if (categories !== undefined) updateData.categories = categories;
    if (parsedScheduledAt) updateData.scheduledAt = parsedScheduledAt;
    // Prevent stale scheduled timestamps from affecting future status transitions.
    if (
      (status !== undefined || published !== undefined) &&
      targetStatusForUpdate !== BLOG_STATUS.SCHEDULED &&
      scheduledAt === undefined
    ) {
      updateData.scheduledAt = null;
    }
    if (image !== undefined) {
      updateData.image = image || null;
      if (!image && existingBlog.image?.includes("/uploads/blog-images/")) {
        const filePath = `uploads/blog-images/${existingBlog.image.split("/uploads/blog-images/")[1]}`;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    if (publicationId !== undefined)
      updateData.publicationId = publicationId ? parseInt(publicationId) : null;

    if (status !== undefined || published !== undefined) {
      Object.assign(
        updateData,
        this.syncStatusAndPublished(targetStatusForUpdate),
      );
    }
    if (slug !== existingBlog.slug) updateData.slug = slug;

    if (
      existingBlog.masterId &&
      targetStatusForUpdate === BLOG_STATUS.PUBLISHED
    ) {
      const [masterBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, existingBlog.masterId));
      if (masterBlog) {
        const mergeData = {
          title: (updateData.title || existingBlog.title).replace(
            /\s*\[Update draft\]$/i,
            "",
          ),
          description: updateData.description || existingBlog.description,
          content: updateData.content || existingBlog.content,
          image: updateData.hasOwnProperty("image")
            ? updateData.image
            : existingBlog.image,
          categories: updateData.categories || existingBlog.categories,
          updatedAt: new Date(),
        };

        const [updatedMaster] = await db.transaction(async (tx) => {
          const [updated] = await tx
            .update(blog)
            .set(mergeData)
            .where(eq(blog.id, existingBlog.masterId))
            .returning();
          await tx.delete(blog).where(eq(blog.id, parseInt(id)));
          return [updated];
        });
        return updatedMaster;
      } else {
        throw new Error(
          "Original article not found. Cannot publish this draft as an update.|404",
        );
      }
    }

    const [updatedBlog] = await db
      .update(blog)
      .set(updateData)
      .where(eq(blog.id, parseInt(id)))
      .returning();

    if (updatedBlog.status === BLOG_STATUS.SCHEDULED && updatedBlog.scheduledAt)
      schedulerService.onBlogScheduled(updatedBlog.id);
    else if (
      existingBlog.status === BLOG_STATUS.SCHEDULED &&
      updatedBlog.status !== BLOG_STATUS.SCHEDULED
    )
      schedulerService.onBlogUnscheduled(updatedBlog.id);

    if (status !== undefined && status !== existingBlog.status) {
      if (status === BLOG_STATUS.REVIEW && existingBlog.publicationId) {
        runInBackground("put-review-notifications", () =>
          this.notifyReviewSubmission({
            publicationId: existingBlog.publicationId,
            authorId: existingBlog.authorId,
            actorId: currentUser.id,
            actorName: currentUser.name,
            blogId: parseInt(id),
          }),
        );
      }
      if (
        status === BLOG_STATUS.PUBLISHED &&
        existingBlog.status !== BLOG_STATUS.PUBLISHED
      ) {
        runInBackground("put-published-notification", () =>
          notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedBlog.title,
            blogId: parseInt(id),
            publicationId: updatedBlog.publicationId,
          }),
        );
      }
    }

    return updatedBlog;
  }

  async reviewAction(id, data, currentUser) {
    const { action, targetStatus: requestedTargetStatus } = data;
    if (!["accept", "reject"].includes(action))
      throw new Error("Action must be 'accept' or 'reject'|400");

    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));
    if (!existingBlog) throw new Error("Blog not found|404");

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) throw new Error("Not authorized to review this blog|403");

    let targetStatus;
    if (action === "accept") {
      targetStatus =
        requestedTargetStatus &&
        [BLOG_STATUS.PUBLISHED, BLOG_STATUS.UNPUBLISHED].includes(
          requestedTargetStatus,
        )
          ? requestedTargetStatus
          : BLOG_STATUS.UNPUBLISHED;
    } else {
      targetStatus = BLOG_STATUS.DRAFT;
    }
    const syncedFields = this.syncStatusAndPublished(targetStatus);

    if (
      action === "accept" &&
      targetStatus === BLOG_STATUS.PUBLISHED &&
      existingBlog.masterId
    ) {
      const [masterBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, existingBlog.masterId));
      if (masterBlog) {
        const mergeData = {
          title: existingBlog.title.replace(/\s*\[Update draft\]$/i, ""),
          description: existingBlog.description,
          content: existingBlog.content,
          image: existingBlog.image,
          categories: existingBlog.categories,
          updatedAt: new Date(),
          ...syncedFields,
        };

        const [updatedMaster] = await db.transaction(async (tx) => {
          const [updated] = await tx
            .update(blog)
            .set(mergeData)
            .where(eq(blog.id, existingBlog.masterId))
            .returning();
          await tx.delete(blog).where(eq(blog.id, parseInt(id)));
          return [updated];
        });

        runInBackground("review-action-notifications-merged", async () => {
          if (!existingBlog.publicationId) return;
          await notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedMaster.title,
            blogId: updatedMaster.id,
            publicationId: existingBlog.publicationId,
          });
        });
        return updatedMaster;
      }
    }

    const [updatedBlog] = await db
      .update(blog)
      .set({ ...syncedFields, updatedAt: new Date() })
      .where(eq(blog.id, parseInt(id)))
      .returning();

    runInBackground("review-action-notifications", async () => {
      if (!existingBlog.publicationId) return;
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, existingBlog.publicationId));
      if (!pub) return;

      if (action === "accept") {
        if (targetStatus === BLOG_STATUS.PUBLISHED)
          await notificationService.notifyBlogPublished({
            authorId: existingBlog.authorId,
            blogTitle: updatedBlog.title,
            blogId: parseInt(id),
            publicationId: existingBlog.publicationId,
          });
        else
          await notificationService.notifyBlogAccepted({
            authorId: existingBlog.authorId,
            publicationName: pub.name,
            blogId: parseInt(id),
            publicationId: existingBlog.publicationId,
          });
      } else {
        await notificationService.notifyBlogRejected({
          authorId: existingBlog.authorId,
          publicationName: pub.name,
          blogId: parseInt(id),
          publicationId: existingBlog.publicationId,
        });
      }
    });

    return updatedBlog;
  }

  async publishBlog(id, { published, status }, currentUser) {
    let targetStatus;
    if (status !== undefined) targetStatus = status;
    else if (published !== undefined)
      targetStatus = published
        ? BLOG_STATUS.PUBLISHED
        : BLOG_STATUS.UNPUBLISHED;
    else
      throw new Error(
        "Either BLOG_STATUS.PUBLISHED or 'status' must be provided|400",
      );

    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));
    if (!existingBlog) throw new Error("Blog not found|404");

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) throw new Error("Not authorized to modify this blog|403");

    const syncedFields = this.syncStatusAndPublished(targetStatus);
    const updateData = { ...syncedFields, updatedAt: new Date() };

    if (existingBlog.masterId && targetStatus === BLOG_STATUS.PUBLISHED) {
      const [masterBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, existingBlog.masterId));
      if (masterBlog) {
        const mergeData = {
          ...updateData,
          title: existingBlog.title.replace(/\s*\[Update draft\]$/i, ""),
          description: existingBlog.description,
          content: existingBlog.content,
          image: existingBlog.image,
          categories: existingBlog.categories,
        };

        const [updatedMaster] = await db.transaction(async (tx) => {
          const [updated] = await tx
            .update(blog)
            .set(mergeData)
            .where(eq(blog.id, existingBlog.masterId))
            .returning();
          await tx.delete(blog).where(eq(blog.id, parseInt(id)));
          return [updated];
        });
        return updatedMaster;
      }
    }

    const [updatedBlog] = await db
      .update(blog)
      .set(updateData)
      .where(eq(blog.id, parseInt(id)))
      .returning();
    return updatedBlog;
  }

  async deleteBlog(id, currentUser) {
    const [existingBlog] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, parseInt(id)));
    if (!existingBlog) throw new Error("Blog not found|404");

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) throw new Error("Not authorized to delete this blog|403");

    const drafts = await db
      .select()
      .from(blog)
      .where(eq(blog.masterId, parseInt(id)));

    await db.transaction(async (tx) => {
      if (existingBlog.image?.includes("/uploads/blog-images/")) {
        const filePath = `uploads/blog-images/${existingBlog.image.split("/uploads/blog-images/")[1]}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      for (const draft of drafts) {
        if (draft.image?.includes("/uploads/blog-images/")) {
          const filePath = `uploads/blog-images/${draft.image.split("/uploads/blog-images/")[1]}`;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      await tx.delete(blog).where(eq(blog.id, parseInt(id)));
      await tx.delete(blog).where(eq(blog.masterId, parseInt(id)));
    });

    if (existingBlog.status === BLOG_STATUS.SCHEDULED)
      schedulerService.onBlogUnscheduled(parseInt(id));
    return { success: true, id };
  }
}

export const blogService = new BlogService();
