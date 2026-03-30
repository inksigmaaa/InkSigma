import { and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { blog, blogSlugHistory } from "../models/schema.js";

export type BlogRow = typeof blog.$inferSelect;
export type BlogInsert = typeof blog.$inferInsert;
export type BlogUpdate = Partial<BlogInsert>;
export type BlogDatabase = typeof db;
export type BlogTransaction = Parameters<
  Parameters<BlogDatabase["transaction"]>[0]
>[0];

class BlogRepository {
  async findById(
    blogId: number,
    tx?: BlogTransaction,
  ): Promise<BlogRow | null> {
    const [blogRecord] = tx
      ? await tx.select().from(blog).where(eq(blog.id, blogId)).limit(1)
      : await db.select().from(blog).where(eq(blog.id, blogId)).limit(1);

    return blogRecord ?? null;
  }

  async findBySlug(
    slug: string,
    tx?: BlogTransaction,
  ): Promise<BlogRow | null> {
    const [blogRecord] = tx
      ? await tx.select().from(blog).where(eq(blog.slug, slug)).limit(1)
      : await db.select().from(blog).where(eq(blog.slug, slug)).limit(1);

    return blogRecord ?? null;
  }

  async findByMasterId(
    masterId: number,
    tx?: BlogTransaction,
  ): Promise<BlogRow | null> {
    const [blogRecord] = tx
      ? await tx.select().from(blog).where(eq(blog.masterId, masterId)).limit(1)
      : await db.select().from(blog).where(eq(blog.masterId, masterId)).limit(1);

    return blogRecord ?? null;
  }

  async insertBlog(
    data: BlogInsert,
    tx?: BlogTransaction,
  ): Promise<BlogRow> {
    const insertedBlogs = tx
      ? ((await tx.insert(blog).values(data).returning()) as BlogRow[])
      : await db.insert(blog).values(data).returning();
    return insertedBlogs[0];
  }

  async updateById(
    blogId: number,
    data: BlogUpdate,
    tx?: BlogTransaction,
  ): Promise<BlogRow> {
    const updatedBlogs = tx
      ? ((await tx
          .update(blog)
          .set(data)
          .where(eq(blog.id, blogId))
          .returning()) as BlogRow[])
      : await db.update(blog).set(data).where(eq(blog.id, blogId)).returning();

    return updatedBlogs[0];
  }

  async deleteById(blogId: number, tx?: BlogTransaction): Promise<void> {
    if (tx) {
      await tx.delete(blog).where(eq(blog.id, blogId));
      return;
    }

    await db.delete(blog).where(eq(blog.id, blogId));
  }

  async syncSlugHistory(params: {
    tx: BlogTransaction;
    blogId: number;
    previousSlug?: string | null;
    nextSlug?: string | null;
  }): Promise<void> {
    const { tx, blogId, previousSlug, nextSlug } = params;

    if (!blogId || !nextSlug) {
      return;
    }

    await tx
      .delete(blogSlugHistory)
      .where(
        and(
          eq(blogSlugHistory.blogId, blogId),
          eq(blogSlugHistory.slug, nextSlug),
        ),
      );

    if (!previousSlug || previousSlug === nextSlug) {
      return;
    }

    const [existingHistory] = await tx
      .select({ id: blogSlugHistory.id })
      .from(blogSlugHistory)
      .where(
        and(
          eq(blogSlugHistory.blogId, blogId),
          eq(blogSlugHistory.slug, previousSlug),
        ),
      )
      .limit(1);

    if (!existingHistory) {
      await tx.insert(blogSlugHistory).values({
        blogId,
        slug: previousSlug,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async transaction<T>(
    callback: (tx: BlogTransaction) => Promise<T>,
  ): Promise<T> {
    return db.transaction(callback);
  }
}

export const blogRepository = new BlogRepository();
