import { z } from "zod";

export const byIdParam = z
  .object({ params: z.object({ id: z.coerce.number().int().positive() }) })
  .passthrough();
export const byUserIdParam = z
  .object({ params: z.object({ userId: z.string().min(1) }) })
  .passthrough();
export const byBlogIdParam = z
  .object({ params: z.object({ blogId: z.coerce.number().int().positive() }) })
  .passthrough();
export const byPublicationIdParam = z
  .object({
    params: z.object({ publicationId: z.coerce.number().int().positive() }),
  })
  .passthrough();
export const byNotificationIdParam = z
  .object({
    params: z.object({ notificationId: z.coerce.number().int().positive() }),
  })
  .passthrough();

export const trackViewSchema = z.object({
  body: z.object({ blogId: z.coerce.number().int().positive() }).passthrough(),
});
export const commentSchema = z.object({
  body: z
    .object({
      content: z.string().min(1),
      parentId: z.coerce.number().int().positive().nullable().optional(),
    })
    .passthrough(),
});
