import { z } from "zod";
import { BLOG_STATUS } from "../config/constants.js";

const stringToNumber = z.string().transform((val) => {
  const num = parseInt(val, 10);
  if (isNaN(num)) throw new Error("Invalid number");
  return num;
});

export const getBlogsSchema = z.object({
  query: z
    .object({
      published: z.string().optional(),
      status: z
        .enum([
          BLOG_STATUS.DRAFT,
          BLOG_STATUS.PUBLISHED,
          BLOG_STATUS.UNPUBLISHED,
          BLOG_STATUS.TRASH,
          BLOG_STATUS.SCHEDULED,
          BLOG_STATUS.REVIEW,
        ])
        .optional(),
      authorId: z.string().optional(),
      publicationId: z.string().optional(),
      categories: z.union([z.string(), z.array(z.string())]).optional(),
      search: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
      offset: z.coerce.number().int().min(0).default(0),
      includeUnpublished: z.string().optional(),
      includeStats: z.string().optional(),
    })
    .passthrough(),
});

export const getPublicationBlogsSchema = z.object({
  params: z.object({
    publicationId: z.coerce.number().int().positive(),
  }),
  query: z
    .object({
      status: z
        .enum([
          BLOG_STATUS.DRAFT,
          BLOG_STATUS.PUBLISHED,
          BLOG_STATUS.UNPUBLISHED,
          BLOG_STATUS.TRASH,
          BLOG_STATUS.SCHEDULED,
          BLOG_STATUS.REVIEW,
        ])
        .optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
      offset: z.coerce.number().int().min(0).default(0),
      includeStats: z.string().optional(),
    })
    .passthrough(),
});

export const byIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z
    .object({
      incrementView: z.string().optional(),
    })
    .passthrough(),
});

export const bySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z
    .object({
      incrementView: z.string().optional(),
    })
    .passthrough(),
});

export const createBlogSchema = z.object({
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      categories: z.array(z.string()).optional(),
      published: z.boolean().optional(),
      status: z
        .enum([
          BLOG_STATUS.DRAFT,
          BLOG_STATUS.PUBLISHED,
          BLOG_STATUS.UNPUBLISHED,
          BLOG_STATUS.TRASH,
          BLOG_STATUS.SCHEDULED,
          BLOG_STATUS.REVIEW,
        ])
        .optional(),
      scheduledAt: z.string().datetime().optional().or(z.date().optional()),
      publicationId: z.coerce.number().int().positive().optional(),
    })
    .passthrough(), // Allow other fields to pass for now to avoid breaking existing frontend logic
});

export const autoSaveSchema = z.object({
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      categories: z.array(z.string()).optional(),
      publicationId: z.coerce.number().int().positive().optional(),
    })
    .passthrough(),
});

export const updateBlogSchema = byIdSchema.extend({
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      categories: z.array(z.string()).optional(),
      image: z.string().nullable().optional(),
      published: z.boolean().optional(),
      status: z
        .enum([
          BLOG_STATUS.DRAFT,
          BLOG_STATUS.PUBLISHED,
          BLOG_STATUS.UNPUBLISHED,
          BLOG_STATUS.TRASH,
          BLOG_STATUS.SCHEDULED,
          BLOG_STATUS.REVIEW,
        ])
        .optional(),
      scheduledAt: z.string().datetime().optional().or(z.date().optional()),
      publicationId: z.coerce.number().int().positive().nullable().optional(),
    })
    .passthrough(),
});

export const reviewActionSchema = byIdSchema.extend({
  body: z
    .object({
      action: z.enum(["accept", "reject"]),
      targetStatus: z.enum([BLOG_STATUS.PUBLISHED, BLOG_STATUS.UNPUBLISHED]).optional(),
    })
    .passthrough(),
});

export const publishSchema = byIdSchema.extend({
  body: z
    .object({
      published: z.boolean().optional(),
      status: z
        .enum([
          BLOG_STATUS.DRAFT,
          BLOG_STATUS.PUBLISHED,
          BLOG_STATUS.UNPUBLISHED,
          BLOG_STATUS.TRASH,
          BLOG_STATUS.SCHEDULED,
          BLOG_STATUS.REVIEW,
        ])
        .optional(),
    })
    .passthrough(),
});
