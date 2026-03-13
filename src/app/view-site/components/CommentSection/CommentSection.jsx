"use client";

import { useEffect, useState } from "react";

async function readErrorMessage(response) {
    try {
        const payload = await response.json();
        return payload.error ?? "Request failed";
    } catch {
        return "Request failed";
    }
}

function formatRelativeTime(value) {
    const now = Date.now();
    const timestamp = new Date(value).getTime();
    const difference = timestamp - now;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (Math.abs(difference) < hour) {
        return formatter.format(Math.round(difference / minute), "minute");
    }

    if (Math.abs(difference) < day) {
        return formatter.format(Math.round(difference / hour), "hour");
    }

    return formatter.format(Math.round(difference / day), "day");
}

export default function CommentSection({ blogId }) {
    const [comments, setComments] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [expandedReplies, setExpandedReplies] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchComments = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/comments?blogId=${blogId}`, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(await readErrorMessage(response));
            }

            const payload = await response.json();
            setComments(payload.comments ?? []);
            setCurrentUserId(payload.currentUserId ?? null);
        } catch (fetchError) {
            setError(fetchError.message);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!blogId) {
            return;
        }

        fetchComments();
    }, [blogId]);

    const submitComment = async ({ content, parentId = null }) => {
        const response = await fetch("/api/comments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                blogId,
                content,
                parentId,
            }),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response));
        }

        await fetchComments();
    };

    const deleteComment = async (commentId) => {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response));
        }

        await fetchComments();
    };

    const canComment = currentUserId !== null;

    return (
        <div className="pt-8 md:pt-12">
            <div className="my-6 md:my-12 border-t border-gray-200 pt-6 md:pt-8">
                <h2 className="text-lg md:text-2xl font-bold text-black mb-6 md:mb-8">
                    How useful was this blog?
                </h2>

                {!canComment && (
                    <p className="mb-4 text-sm text-gray-500">
                        Sign in to leave a comment.
                    </p>
                )}

                <div className="flex gap-3 md:gap-4 mb-6">
                    <div className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <textarea
                            placeholder="Enter your comment"
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            className="w-full min-h-[120px] md:min-h-[140px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 resize-none text-black text-sm md:text-base placeholder:text-gray-400"
                            maxLength={1000}
                            disabled={!canComment}
                        />
                        <div className="flex justify-end items-center mt-3">
                            <button
                                onClick={async () => {
                                    try {
                                        await submitComment({ content: newComment.trim() });
                                        setNewComment("");
                                    } catch (submitError) {
                                        setError(submitError.message);
                                    }
                                }}
                                className="px-6 py-2 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                                disabled={!canComment || newComment.trim() === ""}
                            >
                                Add Comment
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="mt-8 md:mt-12">
                <h3 className="text-lg md:text-xl font-bold text-black mb-4 md:mb-6">
                    Discussions ({comments.length})
                </h3>

                {loading ? (
                    <p className="text-gray-500 py-8">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-gray-500 py-8">No comments yet. Be the first to share your thoughts.</p>
                ) : (
                    <div className="space-y-4 md:space-y-6">
                        {comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
                                <div className="flex gap-3 md:gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="font-semibold text-gray-900 text-sm md:text-base">
                                                {comment.author?.name || "Guest"}
                                            </span>
                                            <span className="text-xs md:text-sm text-gray-400">
                                                {formatRelativeTime(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-3 text-sm md:text-base break-words">
                                            {comment.content}
                                        </p>
                                        <div className="flex gap-3 text-sm items-center">
                                            {canComment && (
                                                <button
                                                    onClick={() => setReplyingTo(comment.id)}
                                                    className="text-gray-500 hover:text-gray-700 text-xs md:text-sm"
                                                >
                                                    Reply
                                                </button>
                                            )}
                                            {currentUserId === comment.authorId && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await deleteComment(comment.id);
                                                        } catch (deleteError) {
                                                            setError(deleteError.message);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-xs md:text-sm"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                        {comment.replies.length > 0 && (
                                            <button
                                                onClick={() =>
                                                    setExpandedReplies((currentValue) => ({
                                                        ...currentValue,
                                                        [comment.id]: !currentValue[comment.id],
                                                    }))
                                                }
                                                className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700"
                                            >
                                                Replies ({comment.replies.length})
                                            </button>
                                        )}

                                        {replyingTo === comment.id && (
                                            <div className="mt-4 bg-white rounded-lg p-3 md:p-4">
                                                <textarea
                                                    placeholder="Write a reply..."
                                                    value={replyContent}
                                                    onChange={(event) => setReplyContent(event.target.value)}
                                                    className="w-full min-h-[80px] p-3 text-black border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 resize-none text-sm placeholder:text-gray-400"
                                                    maxLength={1000}
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyContent("");
                                                        }}
                                                        className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await submitComment({
                                                                    content: replyContent.trim(),
                                                                    parentId: comment.id,
                                                                });
                                                                setReplyContent("");
                                                                setReplyingTo(null);
                                                            } catch (submitError) {
                                                                setError(submitError.message);
                                                            }
                                                        }}
                                                        className="px-4 py-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                                                        disabled={replyContent.trim() === ""}
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {comment.replies.length > 0 && expandedReplies[comment.id] && (
                                            <div className="mt-4 space-y-3 pl-3 md:pl-6 border-l-2 border-gray-200">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply.id} className="flex gap-3 bg-white p-3 rounded-lg">
                                                        <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <span className="font-semibold text-gray-900 text-sm">
                                                                    {reply.author?.name || "Guest"}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {formatRelativeTime(reply.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-600 text-sm mb-2 break-words">
                                                                {reply.content}
                                                            </p>
                                                            {currentUserId === reply.authorId && (
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await deleteComment(reply.id);
                                                                        } catch (deleteError) {
                                                                            setError(deleteError.message);
                                                                        }
                                                                    }}
                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
