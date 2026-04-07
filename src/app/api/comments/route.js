import {
    authorizationErrorToResponse,
    getSessionOrNull,
    requireSession,
} from "@/server/auth/session";
import { sanitizePlainText } from "@/lib/sanitization";
import { parseCommentPayload } from "@/lib/validation/comments";
import {
    createCommentForBlog,
    getBlogCommentContext,
    listCommentsForBlog,
} from "@/server/comments/service";
import { ZodError } from "zod";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const blogId = Number.parseInt(searchParams.get("blogId") ?? "", 10);
        const session = await getSessionOrNull();

        if (Number.isNaN(blogId)) {
            return Response.json({ error: "Invalid blog id" }, { status: 400 });
        }

        const blogContext = await getBlogCommentContext(blogId);

        if (!blogContext || blogContext.status !== "published") {
            return Response.json({ error: "Blog not found" }, { status: 404 });
        }

        const comments = await listCommentsForBlog(blogId);
        return Response.json({
            comments,
            currentUserId: session?.user.id ?? null,
        });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        console.error("Error fetching comments:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await requireSession();
        const body = await request.json();
        const payload = parseCommentPayload({
            blogId: Number.parseInt(body?.blogId, 10),
            content: sanitizePlainText(body?.content ?? ""),
            parentId: body?.parentId
                ? Number.parseInt(body.parentId, 10)
                : null,
        });

        const createdComment = await createCommentForBlog({
            authorId: session.user.id,
            blogId: payload.blogId,
            content: payload.content,
            parentId: payload.parentId,
        });

        return Response.json(createdComment, { status: 201 });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        if (error instanceof ZodError) {
            return Response.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
        }

        if (error instanceof Error && error.message === "Blog not found") {
            return Response.json({ error: error.message }, { status: 404 });
        }

        console.error("Error creating comment:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
