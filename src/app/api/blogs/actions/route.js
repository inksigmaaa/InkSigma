import {
    authorizationErrorToResponse,
    requirePublicationOwner,
} from "@/server/auth/session";
import { BLOG_STATUS_VALUES } from "@/lib/blogs/core";
import {
    bulkUpdateBlogStatus,
    deleteBlogsForPublication,
} from "@/server/blogs/service";

const ALLOWED_ACTIONS = new Set([
    ...BLOG_STATUS_VALUES,
    "restore",
    "delete",
    "publish",
    "unpublish",
    "trash",
]);

export async function POST(request) {
    try {
        const { publication } = await requirePublicationOwner();
        const payload = await request.json();
        const blogIds = Array.isArray(payload?.ids)
            ? payload.ids
                  .map((id) => Number.parseInt(id, 10))
                  .filter((id) => !Number.isNaN(id))
            : [];
        const action = payload?.action;

        if (blogIds.length === 0) {
            return Response.json({ error: "At least one blog id is required" }, { status: 400 });
        }

        if (!ALLOWED_ACTIONS.has(action)) {
            return Response.json({ error: "Invalid blog action" }, { status: 400 });
        }

        if (action === "delete") {
            const deletedBlogs = await deleteBlogsForPublication({
                blogIds,
                publicationId: publication.id,
            });

            return Response.json({ updatedIds: deletedBlogs.map((entry) => entry.id) });
        }

        const normalizedAction = action === "restore" ? "draft" : action;
        const updatedBlogs = await bulkUpdateBlogStatus({
            action: normalizedAction,
            blogIds,
            publicationId: publication.id,
        });

        return Response.json({ blogs: updatedBlogs });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        console.error("Error applying blog action:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
