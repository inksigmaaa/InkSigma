import { z } from "zod";

const subdomainSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const publicationCreateSchema = z.object({
    image: z.union([z.string().max(3_000_000), z.null()]).optional().default(null),
    name: z.string().trim().min(1).max(120),
    subdomain: subdomainSchema,
});

export function parsePublicationCreatePayload(payload) {
    return publicationCreateSchema.parse(payload);
}
