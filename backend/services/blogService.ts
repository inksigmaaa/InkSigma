import { db } from "../config/database.js";
import {
  blog,
  blogSlugHistory,
  user,
  publication,
  publicationMember,
  comment,
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
  isNotNull,
  inArray,
  sql,
} from "drizzle-orm";
import { rm } from "fs/promises";
import notificationService from "./notificationService.js";
import schedulerService from "./schedulerService.js";
import {
  getPublicationAccess,
  hasPublicationRole,
} from "./authorizationService.js";
import { getBlogStats } from "./viewTrackingService.js";
import logger from "../utils/logger.js";
import { BLOG_STATUS } from "../config/constants.js";
import {
  BLOG_IMAGE_UPLOAD_DIRECTORY,
  BLOG_IMAGE_UPLOAD_SEGMENT,
  DEFAULT_BLOG_PAGE_SIZE,
  EMPTY_RICH_TEXT_HTML,
  MAX_BLOG_STATS_BATCH_SIZE,
  PUBLICATION_REVIEW_ROLES,
  REVIEW_ACTIONS,
  TENANT_TYPES,
} from "../constants/blogConstants.js";
import {
  blogRepository,
  type BlogRow,
  type BlogTransaction,
} from "../repositories/blogRepository.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

type BlogUpdatePayload = BlogUpdateData & { publishedAt?: Date | null };

interface BlogInsertData {
  slug: string;
  title: string;
  description: string;
  content: string;
  categories?: string[];
  status?: (typeof BLOG_STATUS)[keyof typeof BLOG_STATUS];
  published?: boolean;
  authorId: string;
  publicationId?: number | null;
  masterId?: number | null;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
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
  status?: (typeof BLOG_STATUS)[keyof typeof BLOG_STATUS];
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
const LEGACY_DRAFT_TITLE = "untitle";
const PUBLISHABLE_CONTENT_SQL = sql<boolean>`
  length(
    trim(
      regexp_replace(
        regexp_replace(coalesce(${blog.content}, ''), '<[^>]+>', ' ', 'g'),
        '&nbsp;',
        ' ',
        'g'
      )
    )
  ) > 0
`;
const PUBLISHABLE_DESCRIPTION_SQL = sql<boolean>`
  length(trim(coalesce(${blog.description}, ''))) > 0
`;
const PUBLISHABLE_TITLE_SQL = sql<boolean>`
  length(trim(coalesce(${blog.title}, ''))) > 0
  and lower(trim(coalesce(${blog.title}, ''))) not in (
    lower(${DEFAULT_DRAFT_TITLE}),
    ${LEGACY_DRAFT_TITLE}
  )
`;
const IS_PUBLISHABLE_SQL = sql<boolean>`
  ${PUBLISHABLE_TITLE_SQL}
  and ${PUBLISHABLE_DESCRIPTION_SQL}
  and ${PUBLISHABLE_CONTENT_SQL}
`;

const LIGHT_BLOG_SELECT_BASE = {
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  description: blog.description,
  image: blog.image,
  publicationId: blog.publicationId,
  categories: blog.categories,
  status: blog.status,
  published: blog.published,
  publishedAt: blog.publishedAt,
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

const LIGHT_BLOG_SELECT_WITH_PUBLISHABILITY = {
  ...LIGHT_BLOG_SELECT_BASE,
  isPublishable: IS_PUBLISHABLE_SQL.as("isPublishable"),
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
  publishedAt: blog.publishedAt,
  publicationId: blog.publicationId,
  scheduledAt: blog.scheduledAt,
  createdAt: blog.createdAt,
  updatedAt: blog.updatedAt,
  authorId: blog.authorId,
  masterId: blog.masterId,
  isPublishable: IS_PUBLISHABLE_SQL.as("isPublishable"),
  author: {
    id: user.id,
    name: user.name,
    image: user.image,
    username: user.username,
  },
};

const runInBackground = (label: string, task: () => Promise<unknown>) => {
  setImmediate(async () => {
    try {
      await task();
    } catch (error) {
      logger.error(error, `[Background Task Error: ${label}]`);
    }
  });
};

class BlogService {
  private buildLightBlogSelect(includePublishability: boolean) {
    return includePublishability
      ? LIGHT_BLOG_SELECT_WITH_PUBLISHABILITY
      : LIGHT_BLOG_SELECT_BASE;
  }

  private chunkBlogIds(blogIds: number[], chunkSize = MAX_BLOG_STATS_BATCH_SIZE) {
    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return [];
    }

    const normalizedChunkSize = Math.max(1, chunkSize);
    const chunks: number[][] = [];

    for (let index = 0; index < blogIds.length; index += normalizedChunkSize) {
      chunks.push(blogIds.slice(index, index + normalizedChunkSize));
    }

    return chunks;
  }

  private async enrichBlogsWithStats<T extends { id: number }>(blogs: T[]) {
    if (!Array.isArray(blogs) || blogs.length === 0) {
      return [];
    }

    const blogIds = blogs.map((entry) => entry.id);
    const statsMap: Record<string, { views: number; shares: number }> = {};
    const commentMap: Record<string, number> = {};

    try {
      const statChunks = this.chunkBlogIds(blogIds);
      const [statsResults, commentsResult] = await Promise.all([
        Promise.all(statChunks.map((chunk) => getBlogStats(chunk))),
        db
          .select({ blogId: comment.blogId, count: count() })
          .from(comment)
          .where(inArray(comment.blogId, blogIds))
          .groupBy(comment.blogId),
      ]);

      for (const batch of statsResults) {
        Object.assign(statsMap, batch);
      }

      for (const row of commentsResult) {
        commentMap[String(row.blogId)] = Number(row.count) || 0;
      }
    } catch (err) {
      logger.error(err, "Batch stat fetch failed:");
    }

    return blogs.map((blogRow) => ({
      ...blogRow,
      views: statsMap[String(blogRow.id)]?.views || 0,
      shares: statsMap[String(blogRow.id)]?.shares || 0,
      comments: commentMap[String(blogRow.id)] || 0,
      revisits: 0,
    }));
  }

  isMissingRealTitle(title) {
    const normalized =
      typeof title === "string" ? title.trim().toLowerCase() : "";

    return (
      !normalized ||
      normalized === DEFAULT_DRAFT_TITLE.toLowerCase() ||
      normalized === LEGACY_DRAFT_TITLE
    );
  }

  hasMeaningfulDescription(description) {
    return typeof description === "string" && description.trim().length > 0;
  }

  hasMeaningfulContent(content) {
    if (typeof content !== "string") {
      return false;
    }

    const normalized = content
      .replace(/&nbsp;/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return normalized.length > 0;
  }

  validatePublishableFields({ title, description, content }, action = "publish") {
    if (
      this.isMissingRealTitle(title) ||
      !this.hasMeaningfulDescription(description) ||
      !this.hasMeaningfulContent(content)
    ) {
      throw new ValidationError(
        `Title, description, and content are required to ${action}`,
      );
    }
  }

  buildDraftScopeCondition(
    draftScope?: "all" | "publishedCopies",
    status?: string,
  ) {
    if (!draftScope || draftScope === "all") {
      return null;
    }

    if (draftScope === "publishedCopies") {
      if (status === BLOG_STATUS.DRAFT) {
        return isNotNull(blog.masterId);
      }

      if (status) {
        return null;
      }

      return or(
        ne(blog.status, BLOG_STATUS.DRAFT),
        and(eq(blog.status, BLOG_STATUS.DRAFT), isNotNull(blog.masterId)),
      );
    }

    return null;
  }

  // Helper function to check if user can modify a blog
  async canUserModifyBlog(userId, blogAuthorId, blogPublicationId) {
    if (!userId || !blogAuthorId) return false;

    if (userId === blogAuthorId) {
      return true;
    }

    if (!blogPublicationId) {
      return false;
    }

    const access = await getPublicationAccess(userId, blogPublicationId);
    return hasPublicationRole(access, [...PUBLICATION_REVIEW_ROLES], {
      allowOwner: true,
    });
  }

  private isTenantPublicationRequest(tenant) {
    return (
      tenant?.type === TENANT_TYPES.SUBDOMAIN ||
      tenant?.type === TENANT_TYPES.CUSTOM_DOMAIN
    );
  }

  private getBlogImageFilePath(imagePath?: string | null) {
    if (!imagePath?.includes(BLOG_IMAGE_UPLOAD_SEGMENT)) {
      return null;
    }

    const [, relativePath] = imagePath.split(BLOG_IMAGE_UPLOAD_SEGMENT);
    return relativePath
      ? `${BLOG_IMAGE_UPLOAD_DIRECTORY}/${relativePath}`
      : null;
  }

  private async removeUploadedBlogImage(imagePath?: string | null) {
    const filePath = this.getBlogImageFilePath(imagePath);
    if (filePath) {
      await rm(filePath, { force: true });
    }
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
      const currentSlugConditions = [eq(blog.slug, slug)];
      if (excludeId != null) {
        currentSlugConditions.push(ne(blog.id, excludeId));
      }

      const [existing] = await db
        .select({ id: blog.id })
        .from(blog)
        .where(and(...currentSlugConditions))
        .limit(1);

      const historyConditions = [eq(blogSlugHistory.slug, slug)];
      if (excludeId != null) {
        historyConditions.push(ne(blogSlugHistory.blogId, excludeId));
      }

      const [existingHistory] = await db
        .select({ id: blogSlugHistory.id })
        .from(blogSlugHistory)
        .where(and(...historyConditions))
        .limit(1);

      if (!existing && !existingHistory) break;

      slug = `${normalizedBaseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async syncBlogSlugHistory({
    tx,
    blogId,
    previousSlug,
    nextSlug,
  }: {
    tx: BlogTransaction;
    blogId: number;
    previousSlug?: string | null;
    nextSlug?: string | null;
  }) {
    await blogRepository.syncSlugHistory({ tx, blogId, previousSlug, nextSlug });
  }

  private async authorizeUpdate(blogId: number, currentUser): Promise<BlogRow> {
    const existingBlog = await blogRepository.findById(blogId);
    if (!existingBlog) {
      throw new NotFoundError("Blog not found");
    }

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) {
      throw new ForbiddenError("Not authorized to update this blog");
    }

    return existingBlog;
  }

  private async processContentMerge({
    blogId,
    data,
    existingBlog,
  }: {
    blogId: number;
    data: Record<string, unknown>;
    existingBlog: BlogRow;
  }): Promise<{ updatedBlog: BlogRow; mergedIntoMaster: boolean }> {
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
      parsedScheduledAt = new Date(String(scheduledAt));
      if (Number.isNaN(parsedScheduledAt.getTime())) {
        throw new ValidationError("Invalid scheduled time");
      }
      if (parsedScheduledAt <= new Date()) {
        throw new ValidationError("Scheduled time must be in the future");
      }
    }

    let targetStatusForUpdate = existingBlog.status;
    if (status !== undefined) {
      targetStatusForUpdate = status as (typeof BLOG_STATUS)[keyof typeof BLOG_STATUS];
    } else if (published !== undefined) {
      targetStatusForUpdate = published
        ? BLOG_STATUS.PUBLISHED
        : BLOG_STATUS.DRAFT;
    }
    if (parsedScheduledAt) {
      targetStatusForUpdate = BLOG_STATUS.SCHEDULED;
    }

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
        throw new ValidationError("Scheduled time is required for scheduled status");
      }
      if (effectiveScheduledAt <= new Date()) {
        throw new ValidationError("Scheduled time must be in the future");
      }
    }

    const updateData: BlogUpdatePayload = {
      updatedAt: new Date(),
    };
    let slug = existingBlog.slug;

    if (title !== undefined) {
      if (typeof title !== "string") {
        throw new ValidationError("Title cannot be empty");
      }
      const nextTitle =
        title.trim() === "" && targetStatusForUpdate === BLOG_STATUS.DRAFT
          ? DEFAULT_DRAFT_TITLE
          : title.trim();
      if (!nextTitle) {
        throw new ValidationError("Title cannot be empty");
      }
      updateData.title = nextTitle;
      if (nextTitle !== existingBlog.title) {
        slug = await this.ensureUniqueSlug(this.generateSlug(nextTitle), blogId);
      }
    }

    if (description !== undefined && typeof description === "string") {
      updateData.description = description.trim();
    }
    if (content !== undefined && typeof content === "string") {
      updateData.content = sanitizeHtml(content.trim());
    }
    if (categories !== undefined && Array.isArray(categories)) {
      updateData.categories = categories;
    }
    if (parsedScheduledAt) {
      updateData.scheduledAt = parsedScheduledAt;
    }
    if (
      (status !== undefined || published !== undefined) &&
      targetStatusForUpdate !== BLOG_STATUS.SCHEDULED &&
      scheduledAt === undefined
    ) {
      updateData.scheduledAt = null;
    }
    if (image !== undefined) {
      updateData.image = typeof image === "string" && image ? image : null;
      if (!image) {
        await this.removeUploadedBlogImage(existingBlog.image);
      }
    }
    if (publicationId !== undefined) {
      updateData.publicationId = publicationId ? parseInt(String(publicationId)) : null;
    }

    if (status !== undefined || published !== undefined) {
      Object.assign(
        updateData,
        this.syncStatusAndPublished(targetStatusForUpdate),
      );
      if (
        targetStatusForUpdate === BLOG_STATUS.PUBLISHED &&
        existingBlog.status !== BLOG_STATUS.PUBLISHED
      ) {
        updateData.publishedAt = new Date();
      }
    }
    if (slug !== existingBlog.slug) {
      updateData.slug = slug;
    }

    if (targetStatusForUpdate !== BLOG_STATUS.DRAFT) {
      this.validatePublishableFields(
        {
          title: updateData.title ?? existingBlog.title,
          description: updateData.description ?? existingBlog.description,
          content: updateData.content ?? existingBlog.content,
        },
        targetStatusForUpdate === BLOG_STATUS.PUBLISHED
          ? "publish this article"
          : "save this article",
      );
    }

    if (
      existingBlog.masterId &&
      targetStatusForUpdate === BLOG_STATUS.PUBLISHED
    ) {
      const masterBlog = await blogRepository.findById(existingBlog.masterId);
      if (!masterBlog) {
        throw new NotFoundError(
          "Original article not found. Cannot publish this draft as an update.",
        );
      }

      const mergedTitle = (updateData.title || existingBlog.title).replace(
        /\s*\[Update draft\]$/i,
        "",
      );
      let mergedSlug = masterBlog.slug;
      if (mergedTitle !== masterBlog.title) {
        mergedSlug = await this.ensureUniqueSlug(
          this.generateSlug(mergedTitle),
          masterBlog.id,
        );
      }

      const mergeData = {
        title: mergedTitle,
        description: updateData.description || existingBlog.description,
        content: updateData.content || existingBlog.content,
        image: Object.prototype.hasOwnProperty.call(updateData, "image")
          ? updateData.image
          : existingBlog.image,
        categories: updateData.categories || existingBlog.categories,
        ...(mergedSlug !== masterBlog.slug ? { slug: mergedSlug } : {}),
        updatedAt: new Date(),
      };

      const updatedBlog = await blogRepository.transaction(async (tx) => {
        if (mergedSlug !== masterBlog.slug) {
          await this.syncBlogSlugHistory({
            tx,
            blogId: masterBlog.id,
            previousSlug: masterBlog.slug,
            nextSlug: mergedSlug,
          });
        }

        const updatedMaster = await blogRepository.updateById(
          existingBlog.masterId,
          mergeData,
          tx,
        );
        await blogRepository.deleteById(blogId, tx);
        return updatedMaster;
      });

      return {
        updatedBlog,
        mergedIntoMaster: true,
      };
    }

    const updatedBlog = await blogRepository.transaction(async (tx) => {
      if (slug !== existingBlog.slug) {
        await this.syncBlogSlugHistory({
          tx,
          blogId,
          previousSlug: existingBlog.slug,
          nextSlug: slug,
        });
      }

      return blogRepository.updateById(blogId, updateData, tx);
    });

    return {
      updatedBlog,
      mergedIntoMaster: false,
    };
  }

  private triggerPostUpdateEffects({
    blogId,
    existingBlog,
    updatedBlog,
    requestedStatus,
    currentUser,
  }: {
    blogId: number;
    existingBlog: BlogRow;
    updatedBlog: BlogRow;
    requestedStatus: unknown;
    currentUser: { id: string; name?: string | null };
  }) {
    if (updatedBlog.status === BLOG_STATUS.SCHEDULED && updatedBlog.scheduledAt) {
      schedulerService.onBlogScheduled(updatedBlog.id);
    } else if (
      existingBlog.status === BLOG_STATUS.SCHEDULED &&
      updatedBlog.status !== BLOG_STATUS.SCHEDULED
    ) {
      schedulerService.onBlogUnscheduled(updatedBlog.id);
    }

    if (requestedStatus === undefined || requestedStatus === existingBlog.status) {
      return;
    }

    if (
      requestedStatus === BLOG_STATUS.REVIEW &&
      existingBlog.publicationId
    ) {
      runInBackground("put-review-notifications", async () => {
        await this.notifyReviewSubmission({
          publicationId: existingBlog.publicationId,
          authorId: existingBlog.authorId,
          actorId: currentUser.id,
          actorName: currentUser.name,
          blogId,
        });
      });
    }

    if (
      requestedStatus === BLOG_STATUS.PUBLISHED &&
      existingBlog.status !== BLOG_STATUS.PUBLISHED
    ) {
      runInBackground("put-published-notification", async () => {
        await notificationService.notifyBlogPublished({
          authorId: existingBlog.authorId,
          blogTitle: updatedBlog.title,
          blogId,
          publicationId: updatedBlog.publicationId,
        });
      });
    }
  }

  async getFullBlogById(blogId: number | null | undefined) {
    if (!blogId) {
      return null;
    }

    const [blogData] = await db
      .select(FULL_BLOG_SELECT)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(eq(blog.id, blogId))
      .limit(1);

    return blogData ?? null;
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
      throw new ValidationError(
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
            eq(publicationMember.role, PUBLICATION_REVIEW_ROLES[0]),
            eq(publicationMember.role, PUBLICATION_REVIEW_ROLES[1]),
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
      draftScope,
      status,
      authorId,
      categories,
      search,
      limit = DEFAULT_BLOG_PAGE_SIZE,
      offset = 0,
      includeUnpublished,
      includeStats,
    } = query;

    let publicationId = query.publicationId;
    if (this.isTenantPublicationRequest(tenant)) {
      if (!tenant.publication) {
        throw new NotFoundError("Publication not found");
      }
      publicationId = String(tenant.publication.id);
    }

    const shouldComputePublishability = Boolean(
      currentUserId ||
        includeUnpublished === "true" ||
        draftScope ||
        (status && status !== BLOG_STATUS.PUBLISHED),
    );

    let dbQuery = db
      .select(this.buildLightBlogSelect(shouldComputePublishability))
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id));

    const conditions = [];

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

    const draftScopeCondition = this.buildDraftScopeCondition(
      draftScope,
      status,
    );
    if (draftScopeCondition) {
      conditions.push(draftScopeCondition);
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

    const shouldOrderByPublishedAt =
      status === BLOG_STATUS.PUBLISHED ||
      published === "true" ||
      (!currentUserId &&
        status === undefined &&
        published === undefined &&
        (!includeUnpublished || includeUnpublished !== "true"));

    if (shouldOrderByPublishedAt) {
      dbQuery = dbQuery.orderBy(
        desc(sql`coalesce(${blog.publishedAt}, ${blog.createdAt})`),
        desc(blog.createdAt),
      ) as typeof dbQuery;
    } else {
      dbQuery = dbQuery.orderBy(desc(blog.createdAt)) as typeof dbQuery;
    }

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

    return this.enrichBlogsWithStats(blogs);
  }

  async getPublicBlogs(publicationId) {
    return db
      .select(LIGHT_BLOG_SELECT_BASE)
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
    const {
      status,
      draftScope,
      limit = DEFAULT_BLOG_PAGE_SIZE,
      offset = 0,
      includeStats,
    } = query;

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
      throw new NotFoundError("Publication not found");
    }

    const isOwner = pub.userId === currentUser.id;
    const isMember = !!memberCheck;

    if (!isOwner && !isMember) {
      throw new ForbiddenError("Access denied");
    }

    const conditions = [eq(blog.publicationId, parseInt(publicationId))];
    if (status) conditions.push(eq(blog.status, status));

    const draftScopeCondition = this.buildDraftScopeCondition(
      draftScope,
      status,
    );
    if (draftScopeCondition) {
      conditions.push(draftScopeCondition);
    }

    let publicationBlogsQuery = db
      .select(LIGHT_BLOG_SELECT_WITH_PUBLISHABILITY)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(and(...conditions));

    if (status === BLOG_STATUS.PUBLISHED) {
      publicationBlogsQuery = publicationBlogsQuery.orderBy(
        desc(sql`coalesce(${blog.publishedAt}, ${blog.createdAt})`),
        desc(blog.createdAt),
      ) as typeof publicationBlogsQuery;
    } else {
      publicationBlogsQuery = publicationBlogsQuery.orderBy(
        desc(blog.createdAt),
      ) as typeof publicationBlogsQuery;
    }

    const blogs = await publicationBlogsQuery
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

    return this.enrichBlogsWithStats(blogs);
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
        publishedAt: blog.publishedAt,
        publicationId: blog.publicationId,
        scheduledAt: blog.scheduledAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        authorId: blog.authorId,
        masterId: blog.masterId,
        isPublishable: IS_PUBLISHABLE_SQL.as("isPublishable"),
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

    if (!blogData) throw new NotFoundError("Blog not found");

    if (this.isTenantPublicationRequest(tenant)) {
      if (!tenant.publication) throw new NotFoundError("Blog not found");
      if (blogData.publicationId !== tenant.publication.id)
        throw new NotFoundError("Blog not found");
    }

    if (blogData.status !== BLOG_STATUS.PUBLISHED) {
      if (!currentUserId) throw new NotFoundError("Blog not found");

      const canView = await this.canUserModifyBlog(
        currentUserId,
        blogData.authorId,
        blogData.publicationId,
      );

      if (!canView) throw new NotFoundError("Blog not found");
    }

    return blogData;
  }

  async getBlogBySlug(slug, currentUserId, tenant) {
    const currentSlugMatch = await blogRepository.findBySlug(slug);

    let blogData = await this.getFullBlogById(currentSlugMatch?.id);
    let shouldRedirect = false;

    if (!blogData) {
      const [historyMatch] = await db
        .select({ blogId: blogSlugHistory.blogId })
        .from(blogSlugHistory)
        .where(eq(blogSlugHistory.slug, slug))
        .limit(1);

      if (historyMatch?.blogId) {
        blogData = await this.getFullBlogById(historyMatch.blogId);
        shouldRedirect = Boolean(blogData && blogData.slug !== slug);
      }
    }

    if (!blogData) throw new NotFoundError("Blog not found");

    if (this.isTenantPublicationRequest(tenant)) {
      if (!tenant.publication) throw new NotFoundError("Blog not found");
      if (blogData.publicationId !== tenant.publication.id)
        throw new NotFoundError("Blog not found");
    }

    if (blogData.status !== BLOG_STATUS.PUBLISHED) {
      if (!currentUserId) throw new NotFoundError("Blog not found");

      const canView = await this.canUserModifyBlog(
        currentUserId,
        blogData.authorId,
        blogData.publicationId,
      );

      if (!canView) throw new NotFoundError("Blog not found");
    }

    return {
      ...blogData,
      requestedSlug: slug,
      canonicalSlug: blogData.slug,
      shouldRedirect,
      redirectStatusCode: shouldRedirect ? 301 : null,
    };
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
        throw new ValidationError("Invalid scheduled time");
      }
      if (parsedScheduledAt <= new Date()) {
        throw new ValidationError("Scheduled time must be in the future");
      }
    }

    let targetStatus: typeof BLOG_STATUS[keyof typeof BLOG_STATUS] = BLOG_STATUS.DRAFT;
    if (status) targetStatus = status;
    else if (published) targetStatus = BLOG_STATUS.PUBLISHED;
    if (parsedScheduledAt) targetStatus = BLOG_STATUS.SCHEDULED;

    if (targetStatus === BLOG_STATUS.SCHEDULED && !parsedScheduledAt) {
      throw new ValidationError("Scheduled time is required for scheduled status");
    }

    const isDraft = targetStatus === BLOG_STATUS.DRAFT;
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const finalTitle = isDraft
      ? normalizedTitle || DEFAULT_DRAFT_TITLE
      : normalizedTitle;

    const sanitizedContent = content ? sanitizeHtml(content) : content;

    if (!isDraft) {
      this.validatePublishableFields(
        {
          title: finalTitle,
          description,
          content: sanitizedContent,
        },
        "save this article",
      );
    }

    if (publicationId) {
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(publicationId)));

      if (!pub) throw new NotFoundError("Publication not found");

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
        throw new ForbiddenError("You don't have access to this publication");
      }
    }

    const slug = await this.ensureUniqueSlug(this.generateSlug(finalTitle));
    const syncedFields = this.syncStatusAndPublished(targetStatus);
    const now = new Date();

    const blogData: BlogInsertData = {
      slug,
      title: finalTitle,
      description,
      content: sanitizedContent,
      categories: categories || [],
      ...syncedFields,
      authorId: currentUser.id,
      createdAt: now,
      updatedAt: now,
    };

    if (publicationId) blogData.publicationId = parseInt(publicationId);
    if (parsedScheduledAt) blogData.scheduledAt = parsedScheduledAt;
    if (targetStatus === BLOG_STATUS.PUBLISHED) blogData.publishedAt = now;

    const newBlog = await blogRepository.insertBlog(blogData);

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
      (normalizedContent && normalizedContent !== EMPTY_RICH_TEXT_HTML) ||
      (Array.isArray(categories) && categories.length > 0);

    if (!hasMeaningfulContent) {
      throw new ValidationError("Missing required fields");
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

    return blogRepository.insertBlog(blogData);
  }

  async createDraftFromPublished(id, data, currentUser) {
    const originalBlog = await blogRepository.findById(parseInt(id));

    if (!originalBlog) throw new NotFoundError("Blog not found");

    const authorized = await this.canUserModifyBlog(
      currentUser.id,
      originalBlog.authorId,
      originalBlog.publicationId,
    );
    if (!authorized) throw new ForbiddenError("Unauthorized");
    
    if (originalBlog.status !== BLOG_STATUS.PUBLISHED) {
      throw new ValidationError("Only published blogs can be edited as drafts");
    }

    const existingDraft = await blogRepository.findByMasterId(originalBlog.id);

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

    return blogRepository.insertBlog(draftData);
  }
  async updateBlog(id, data, currentUser) {
    const blogId = parseInt(id);
    const existingBlog = await this.authorizeUpdate(blogId, currentUser);
    const updateResult = await this.processContentMerge({
      blogId,
      data,
      existingBlog,
    });

    if (!updateResult.mergedIntoMaster) {
      this.triggerPostUpdateEffects({
        blogId,
        existingBlog,
        updatedBlog: updateResult.updatedBlog,
        requestedStatus: data.status,
        currentUser,
      });
    }

    return updateResult.updatedBlog;
  }

  async reviewAction(id, data, currentUser) {
    const { action, targetStatus: requestedTargetStatus } = data;
    if (![REVIEW_ACTIONS.ACCEPT, REVIEW_ACTIONS.REJECT].includes(action))
      throw new ValidationError("Action must be 'accept' or 'reject'");

    const existingBlog = await blogRepository.findById(parseInt(id));
    if (!existingBlog) throw new NotFoundError("Blog not found");

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) throw new ForbiddenError("Not authorized to review this blog");

    let targetStatus;
    if (action === REVIEW_ACTIONS.ACCEPT) {
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
      action === REVIEW_ACTIONS.ACCEPT &&
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
      .set({
        ...syncedFields,
        updatedAt: new Date(),
        ...(targetStatus === BLOG_STATUS.PUBLISHED &&
        existingBlog.status !== BLOG_STATUS.PUBLISHED
          ? { publishedAt: new Date() }
          : {}),
      })
      .where(eq(blog.id, parseInt(id)))
      .returning();

    runInBackground("review-action-notifications", async () => {
      if (!existingBlog.publicationId) return;
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, existingBlog.publicationId));
      if (!pub) return;

      if (action === REVIEW_ACTIONS.ACCEPT) {
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
      throw new ValidationError(
        "Either BLOG_STATUS.PUBLISHED or 'status' must be provided",
      );

    const existingBlog = await blogRepository.findById(parseInt(id));
    if (!existingBlog) throw new NotFoundError("Blog not found");

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) throw new ForbiddenError("Not authorized to modify this blog");

    const syncedFields = this.syncStatusAndPublished(targetStatus);
    const updateData: {
      status: (typeof BLOG_STATUS)[keyof typeof BLOG_STATUS];
      published: boolean;
      updatedAt: Date;
      publishedAt?: Date;
    } = { ...syncedFields, updatedAt: new Date() };
    if (
      targetStatus === BLOG_STATUS.PUBLISHED &&
      existingBlog.status !== BLOG_STATUS.PUBLISHED
    ) {
      updateData.publishedAt = new Date();
    }

    if (targetStatus === BLOG_STATUS.PUBLISHED) {
      this.validatePublishableFields(
        {
          title: existingBlog.title,
          description: existingBlog.description,
          content: existingBlog.content,
        },
        "publish this article",
      );
    }

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
    const existingBlog = await blogRepository.findById(parseInt(id));
    if (!existingBlog) throw new NotFoundError("Blog not found");

    const canModify = await this.canUserModifyBlog(
      currentUser.id,
      existingBlog.authorId,
      existingBlog.publicationId,
    );
    if (!canModify) throw new ForbiddenError("Not authorized to delete this blog");

    const drafts = await db
      .select()
      .from(blog)
      .where(eq(blog.masterId, parseInt(id)));

    await db.transaction(async (tx) => {
      await this.removeUploadedBlogImage(existingBlog.image);

      for (const draft of drafts) {
        await this.removeUploadedBlogImage(draft.image);
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
