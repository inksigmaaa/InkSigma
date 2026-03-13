import { z } from "zod";

export const commentPayloadSchema = z.object({
    blogId: z.number().int().positive(),
    content: z.string().trim().min(1).max(1000),
    parentId: z.number().int().positive().nullable().optional().default(null),
});

export function parseCommentPayload(payload) {
    return commentPayloadSchema.parse(payload);
}
