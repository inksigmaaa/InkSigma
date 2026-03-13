import {
    authorizationErrorToResponse,
    requireSession,
} from "@/server/auth/session";
import { deleteCommentForUser } from "@/server/comments/service";

export async function DELETE(request, { params }) {
    try {
        const session = await requireSession();
        const resolvedParams = await params;
        const commentId = Number.parseInt(resolvedParams.id, 10);

        if (Number.isNaN(commentId)) {
            return Response.json({ error: "Invalid comment id" }, { status: 400 });
        }

        const deleted = await deleteCommentForUser({
            commentId,
            userId: session.user.id,
        });

        if (!deleted) {
            return Response.json({ error: "Comment not found" }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (error) {
        const authErrorResponse = authorizationErrorToResponse(error);
        if (authErrorResponse) {
            return authErrorResponse;
        }

        console.error("Error deleting comment:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
