import {
    authorizationErrorToResponse,
    requirePublicationOwner,
} from "@/server/auth/session";
import {
    createBlogForPublication,
    listBlogsForPublication,
} from "@/server/blogs/service";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitization";
import { parseBlogWritePayload } from "@/lib/validation/blogs";
import { ZodError } from "zod";

function isValidStatus(status) {
    return !status || status === "all" || ["draft", "published", "scheduled", "unpublished", "trash"].includes(status);
}

export async function GET(request) {
    try {
        const { publication } = await requirePublicationOwner();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") ?? "all";

        if (!isValidStatus(status)) {
            return Response.json({ error: "Invalid blog status" }, { status: 400 });
        }

        const blogs = await listBlogsForPublication(publication.id, status);
        return Response.json({ blogs });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        console.error("Error fetching blogs:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { publication, session } = await requirePublicationOwner();
        const payload = parseBlogWritePayload(await request.json());
        const title = sanitizePlainText(payload.title);
        const description = sanitizePlainText(payload.description);
        const content = sanitizeRichText(payload.content);
        const categories = payload.categories.map((category) => sanitizePlainText(category)).filter(Boolean);

        if (!title || !description || !content) {
            return Response.json({ error: "Title, description, and content are required" }, { status: 400 });
        }

        const createdBlog = await createBlogForPublication({
            action: payload.action,
            authorId: session.user.id,
            categories,
            content,
            description,
            image: payload.image ?? null,
            publicationId: publication.id,
            scheduledFor: payload.scheduledFor ?? null,
            title,
        });

        return Response.json({ blog: createdBlog }, { status: 201 });
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

        console.error("Error creating blog:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
