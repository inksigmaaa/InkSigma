import { db } from '../config/database.js';
import { blog, user, publication, publicationMember, comment, blogShare } from '../models/schema.js';
import { eq, desc, and, or, ilike, count, isNull, sql } from 'drizzle-orm';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = db.select().from(blog).where(eq(blog.slug, slug));
    if (excludeId) {
      query = query.where(and(eq(blog.slug, slug), eq(blog.id, excludeId)));
    }
    const [existing] = await query.limit(1);
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

const syncStatusAndPublished = (status) => {
  const validStatuses = ['draft', 'published', 'unpublished', 'trash', 'scheduled', 'review'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status: ${status}`);
  }
  return { status, published: status === 'published' };
};

export const canUserModifyBlog = async (userId, blogAuthorId, blogPublicationId) => {
  if (!userId || !blogAuthorId) return false;
  if (userId === blogAuthorId) return true;
  if (!blogPublicationId) return false;

  const [pub] = await db
    .select({ ownerId: publication.userId })
    .from(publication)
    .where(eq(publication.id, blogPublicationId));

  if (!pub || pub.ownerId === userId) return pub?.ownerId === userId;

  const [membership] = await db
    .select({ role: publicationMember.role })
    .from(publicationMember)
    .where(and(
      eq(publicationMember.publicationId, blogPublicationId),
      eq(publicationMember.userId, userId)
    ));

  return membership?.role === 'admin' || membership?.role === 'editor';
};

export class BlogController {
  static async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, status, authorId, publicationId, search, published } = req.query;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (status) conditions.push(eq(blog.status, status));
      if (authorId) conditions.push(eq(blog.authorId, parseInt(authorId)));
      if (publicationId) conditions.push(eq(blog.publicationId, parseInt(publicationId)));
      if (search) conditions.push(ilike(blog.title, `%${search}%`));
      if (published !== undefined) conditions.push(eq(blog.published, published === 'true'));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [total] = await db.select({ count: count() }).from(blog).where(where);
      const blogs = await db
        .select({
          id: blog.id,
          title: blog.title,
          description: blog.description,
          content: blog.content,
          slug: blog.slug,
          image: blog.image,
          status: blog.status,
          published: blog.published,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          author: { id: user.id, name: user.name, image: user.image },
          publication: { id: publication.id, name: publication.name, subdomain: publication.subdomain },
        })
        .from(blog)
        .leftJoin(user, eq(blog.authorId, user.id))
        .leftJoin(publication, eq(blog.publicationId, publication.id))
        .where(where)
        .orderBy(desc(blog.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      return paginatedResponse(res, blogs, { page: parseInt(page), limit: parseInt(limit), total: total.count });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const [blogData] = await db
        .select({
          id: blog.id,
          title: blog.title,
          description: blog.description,
          content: blog.content,
          slug: blog.slug,
          image: blog.image,
          status: blog.status,
          published: blog.published,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          author: { id: user.id, name: user.name, image: user.image },
          publication: { id: publication.id, name: publication.name, subdomain: publication.subdomain },
        })
        .from(blog)
        .leftJoin(user, eq(blog.authorId, user.id))
        .leftJoin(publication, eq(blog.publicationId, publication.id))
        .where(eq(blog.id, parseInt(id)));

      if (!blogData) throw new NotFoundError('Blog');

      return successResponse(res, blogData);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { title, description, content, categories, status = 'draft', scheduledAt, publicationId } = req.validated || req.body;
      const slug = await ensureUniqueSlug(generateSlug(title));
      const { status: finalStatus, published } = syncStatusAndPublished(status);

      const [created] = await db.insert(blog).values({
        title,
        description,
        content,
        slug,
        categories: categories || [],
        status: finalStatus,
        published,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publicationId,
        authorId: req.user.id,
      }).returning();

      return createdResponse(res, created, 'Blog created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.validated || req.body;

      const [existing] = await db.select().from(blog).where(eq(blog.id, parseInt(id)));
      if (!existing) throw new NotFoundError('Blog');

      const canModify = await canUserModifyBlog(req.user.id, existing.authorId, existing.publicationId);
      if (!canModify) throw new ForbiddenError('You cannot modify this blog');

      if (data.title && data.title !== existing.title) {
        data.slug = await ensureUniqueSlug(generateSlug(data.title), parseInt(id));
      }

      if (data.status) {
        const { status, published } = syncStatusAndPublished(data.status);
        data.status = status;
        data.published = published;
      }

      if (data.scheduledAt) {
        data.scheduledAt = new Date(data.scheduledAt);
      }

      const [updated] = await db
        .update(blog)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(blog.id, parseInt(id)))
        .returning();

      return successResponse(res, updated, 'Blog updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const [existing] = await db.select().from(blog).where(eq(blog.id, parseInt(id)));
      if (!existing) throw new NotFoundError('Blog');

      const canModify = await canUserModifyBlog(req.user.id, existing.authorId, existing.publicationId);
      if (!canModify) throw new ForbiddenError('You cannot delete this blog');

      await db.delete(blog).where(eq(blog.id, parseInt(id)));

      return successResponse(res, null, 'Blog deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, published } = req.body;

      const [existing] = await db.select().from(blog).where(eq(blog.id, parseInt(id)));
      if (!existing) throw new NotFoundError('Blog');

      const canModify = await canUserModifyBlog(req.user.id, existing.authorId, existing.publicationId);
      if (!canModify) throw new ForbiddenError('You cannot modify this blog');

      let finalStatus = status;
      let finalPublished = published;

      if (status) {
        const synced = syncStatusAndPublished(status);
        finalStatus = synced.status;
        finalPublished = synced.published;
      }

      const [updated] = await db
        .update(blog)
        .set({ status: finalStatus, published: finalPublished, updatedAt: new Date() })
        .where(eq(blog.id, parseInt(id)))
        .returning();

      return successResponse(res, updated, 'Blog status updated');
    } catch (error) {
      next(error);
    }
  }
}
