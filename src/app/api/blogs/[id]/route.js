import {
    authorizationErrorToResponse,
    requirePublicationOwner,
} from "@/server/auth/session";
import { getBlogForPublication, updateBlogForPublication } from "@/server/blogs/service";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitization";
import { parseBlogWritePayload } from "@/lib/validation/blogs";
import { ZodError } from "zod";

function parseBlogId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(request, { params }) {
    try {
        const { publication } = await requirePublicationOwner();
        const resolvedParams = await params;
        const blogId = parseBlogId(resolvedParams.id);

        if (!blogId) {
            return Response.json({ error: "Invalid blog id" }, { status: 400 });
        }

        const blog = await getBlogForPublication(publication.id, blogId);

        if (!blog) {
            return Response.json({ error: "Blog not found" }, { status: 404 });
        }

        return Response.json({ blog });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        console.error("Error fetching blog:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { publication } = await requirePublicationOwner();
        const resolvedParams = await params;
        const blogId = parseBlogId(resolvedParams.id);

        if (!blogId) {
            return Response.json({ error: "Invalid blog id" }, { status: 400 });
        }

        const payload = parseBlogWritePayload(await request.json());
        const title = sanitizePlainText(payload.title);
        const description = sanitizePlainText(payload.description);
        const content = sanitizeRichText(payload.content);
        const categories = payload.categories.map((category) => sanitizePlainText(category)).filter(Boolean);

        if (!title || !description || !content) {
            return Response.json({ error: "Title, description, and content are required" }, { status: 400 });
        }

        const updatedBlog = await updateBlogForPublication({
            action: payload.action,
            blogId,
            categories,
            content,
            description,
            image: payload.image ?? null,
            publicationId: publication.id,
            scheduledFor: payload.scheduledFor ?? null,
            title,
        });

        if (!updatedBlog) {
            return Response.json({ error: "Blog not found" }, { status: 404 });
        }

        return Response.json({ blog: updatedBlog });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        if (error instanceof ZodError) {
            return Response.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
        }

        if (error instanceof Error && error.message.includes("schedule")) {
            return Response.json({ error: error.message }, { status: 400 });
        }

        console.error("Error updating blog:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
