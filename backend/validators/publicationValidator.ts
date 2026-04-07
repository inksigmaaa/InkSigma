import { z } from "zod";

export const byIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const byPublicationIdSchema = z.object({
  params: z.object({
    publicationId: z.coerce.number().int().positive(),
  }),
});

export const bySubdomainSchema = z.object({
  params: z.object({
    subdomain: z
      .string()
      .min(1)
      .max(63)
      .regex(/^[a-z0-9-]+$/),
  }),
});

export const byUserIdSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});

export const createPublicationSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(255),
      subdomain: z
        .string()
        .min(1)
        .max(63)
        .regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      customDomain: z.string().nullable().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .passthrough(),
});

export const updatePublicationSchema = byIdSchema.extend({
  body: z
    .object({
      name: z.string().min(1).max(255).optional(),
      subdomain: z
        .string()
        .min(1)
        .max(63)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      description: z.string().optional(),
      customDomain: z.string().nullable().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .passthrough(),
});

export const deleteImageSchema = byIdSchema.extend({
  params: z.object({
    id: z.coerce.number().int().positive(),
    type: z.enum(["logo", "favicon", "meta-og"]),
  }),
});
