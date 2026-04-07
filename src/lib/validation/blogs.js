import { z } from "zod";

const actionSchema = z.enum(["draft", "publish", "schedule", "unpublish", "trash", "restore"]);

export const blogWriteSchema = z.object({
    action: actionSchema.default("draft"),
    categories: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    content: z.string().trim().min(1).max(200000),
    description: z.string().trim().min(1).max(400),
    image: z.union([z.string().max(3_000_000), z.null()]).optional().default(null),
    scheduledFor: z.string().datetime().nullable().optional().default(null),
    title: z.string().trim().min(1).max(160),
});

export function parseBlogWritePayload(payload) {
    return blogWriteSchema.parse(payload);
}
