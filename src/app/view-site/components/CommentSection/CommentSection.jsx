"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeAgo } from "../../../../utils/timeFormatter";
import UserAvatar from "@/components/ui/UserAvatar";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

export default function CommentSection({ blogId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Guest fields removed as per requirement
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const { showToast } = useToast();

  // Fetch current user session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/get-session`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data?.user || null);
        }
      } catch (err) {
        console.log("Not authenticated");
      }
    };
    fetchUser();
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!blogId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/comments/blog/${blogId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("[CommentSection] Fetched comments:", data);
        setComments(data);
      } else {
        setError("Failed to load comments");
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (timestamp) => {
    const seconds = Math.floor(
      (currentTime - new Date(timestamp).getTime()) / 1000,
    );
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes === 1) return "1 min ago";
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      setError("Please enter a comment");
      return;
    }
    if (!currentUser) {
      setError("Please sign in to comment");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const body = {
        blogId: parseInt(blogId),
        content: newComment.trim(),
      };

      console.log(
        "[CommentSection] Submitting comment to:",
        `${API_URL}/api/comments`,
      );
      console.log("[CommentSection] Request body:", {
        ...body,
        content: body.content.substring(0, 50) + "...",
      });

      const response = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      console.log("[CommentSection] Response status:", response.status);
      console.log("[CommentSection] Response ok:", response.ok);
      console.log("[CommentSection] Response headers:", {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });

      if (response.ok) {
        const comment = await response.json();
        console.log("[CommentSection] New comment created:", comment);
        setComments((prev) => [comment, ...prev]);

        setNewComment("");
        setError(null);
        showToast("Comment added successfully", "success");
      } else {
        let errorMessage = "Failed to post comment";
        let responseData = null;

        try {
          responseData = await response.json();
          console.error("[CommentSection] Error response data:", responseData);
          errorMessage =
            responseData.error || responseData.message || errorMessage;
        } catch (parseErr) {
          console.error(
            "[CommentSection] Failed to parse error response:",
            parseErr,
          );
          const responseText = await response.text();
          console.error("[CommentSection] Raw response text:", responseText);
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }

        console.error("[CommentSection] Failed to post comment:", errorMessage);
        setError(errorMessage);
        showToast(errorMessage, "error");
      }
    } catch (err) {
      console.error("[CommentSection] Fetch error:", err);
      console.error("[CommentSection] Error type:", err?.constructor?.name);
      console.error("[CommentSection] Error message:", err?.message);
      setError("Failed to post comment. Please try again.");
      showToast("Failed to post comment. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyContent.trim()) {
      setError("Please enter a reply");
      return;
    }
    if (!currentUser) {
      setError("Please sign in to reply");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const body = {
        blogId: parseInt(blogId),
        content: replyContent.trim(),
        parentId: commentId,
      };

      console.log("[CommentSection] Submitting reply:", {
        ...body,
        content: body.content.substring(0, 50) + "...",
      });

      const response = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const reply = await response.json();
        console.log("[CommentSection] New reply created:", reply);
        setComments(
          comments.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c,
          ),
        );
        setReplyContent("");
        setReplyingTo(null);
        setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
        setError(null);
        showToast("Reply added successfully", "success");
      } else {
        let errorMessage = "Failed to post reply";
        try {
          const data = await response.json();
          console.error("[CommentSection] Failed to post reply:", data);
          errorMessage = data.error || data.message || errorMessage;
        } catch (parseErr) {
          console.error(
            "[CommentSection] Failed to parse error response:",
            parseErr,
          );
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
        showToast(errorMessage, "error");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      setError("Failed to post reply. Please try again.");
      showToast("Failed to post reply. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/comments/${commentToDelete}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setComments((prev) => {
          if (prev.some((c) => c.id === commentToDelete)) {
            return prev.filter((c) => c.id !== commentToDelete);
          }
          return prev.map((c) => {
            if (c.replies?.some((r) => r.id === commentToDelete)) {
              return {
                ...c,
                replies: c.replies.filter((r) => r.id !== commentToDelete),
              };
            }
            return c;
          });
        });
        showToast("Comment deleted successfully", "success");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete comment");
        showToast(data.error || "Failed to delete comment", "error");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
      showToast("Failed to delete comment", "error");
    } finally {
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const getAuthorAvatar = (author) => {
    if (!author?.image) return null;
    if (author.image.startsWith("http")) return author.image;
    return `${API_URL}${author.image.startsWith("/") ? "" : "/"}${author.image}`;
  };

  const getDisplayName = (comment) => {
    if (comment.author?.name) return comment.author.name;
    return "Guest"; // Fallback for old data if any
  };

  const getInitial = (comment) => {
    const name = getDisplayName(comment);
    return name.charAt(0).toUpperCase();
  };

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0,
  );

  return (
    <div className="mt-12">
      <div className="my-6 ">
        <h2 className="text-base font-semibold leading-6 tracking-normal text-[#14142D] mb-6 max-md:text-sm max-md:pt-5 max-md:border-t max-md:border-[#EDEDED] ">
          How useful was this blog?
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex gap-3 md:gap-4 mb-6">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden flex items-center justify-center max-md:w-6 max-md:h-6">
            {currentUser?.image ? (
              <img
                src={getAuthorAvatar(currentUser)}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-purple-600 font-semibold">
                {currentUser?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full min-h-[94px] p-4 border-[1px] border-[#EAEAEA] rounded-sm focus:outline-none focus:border-[#EAEAEA] resize-none text-black text-sm md:text-base placeholder:text-[#A4A4A4] placeholder:text-base placeholder:font-normal placeholder:leading-6 placeholder:tracking-normal placeholder:align-middle max-md:text-xs max-md:py-2 placeholder:max-md:text-xs"
              maxLength={2000}
              disabled={submitting}
            />
            <div className="flex justify-end items-center mt-1">
              {/* <span className="text-xs text-gray-400">{newComment.length}/2000</span> */}
              <button
                onClick={handleSubmitComment}
                className="px-1 py-2 text-sm font-medium leading-normal tracking-normal bg-gradient-to-b from-[#A941FB] to-[#7864F0EB] bg-clip-text text-transparent disabled:opacity-70 disabled:cursor-not-allowed transition-colors max-md:text-xs"
                disabled={newComment.trim() === "" || submitting}
              >
                {submitting ? "Adding..." : "Add Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3.5">
        <h3 className="text-base font-bold leading-6 tracking-normal text-[#14142D] mb-4 max-md:text-sm max-md:leading-7">
          Discussion ({totalComments})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading Discussion...
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-[#EDEDED] rounded-lg px-10 py-4 max-md:px-4"
                >
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden flex items-center justify-center max-md:w-6 max-md:h-6">
                      {comment.author?.image ? (
                        <img
                          src={getAuthorAvatar(comment.author)}
                          alt={getDisplayName(comment)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-purple-600 font-semibold">
                          {getInitial(comment)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 my-1.5 flex-wrap max-md:my-0">
                        <span className="text-[#404040] text-sm font-semibold leading-5 tracking-normal max-md:text-xs">
                          {getDisplayName(comment)}
                        </span>
                        <span className="text-[#A4A4A4] text-xs font-normal leading-5 tracking-normal max-md:text-[10px]">
                          {getRelativeTime(comment.createdAt)}
                        </span>
                      </div>

                      <p className="text-[#696969] text-sm font-normal leading-5 tracking-normal mt-1 break-words whitespace-pre-wrap max-md:text-xs max-md:leading-normal">
                        {comment.content}
                      </p>

                      <div className="flex gap-4 text-sm items-center my-3">
                        <button
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment.id ? null : comment.id,
                            )
                          }
                          className="text-[#A4A4A4] text-sm font-normal tracking-normal gap-1 flex items-center max-md:text-xs max-md:leading-normal"
                        >
                          <img
                            src="/svg/reply_icon.svg"
                            alt="Reply"
                            className="w-4 h-4 max-md:w-3 max-md:h-3"
                          />
                          Reply
                        </button>

                        {currentUser?.id === comment.authorId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[#A4A4A4] text-sm font-normal tracking-normal gap-1 flex items-center max-md:text-xs max-md:leading-normal"
                          >
                            <img
                              src="/svg/Commet_delete.svg"
                              alt="Delete"
                              className="w-4 h-4 max-md:w-3 max-md:h-3"
                            />
                            Delete
                          </button>
                        )}
                      </div>

                      {comment.replies?.length > 0 && (
                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="mt-4 flex items-center gap-2 text-sm font-semibold leading-none tracking-normal text-[#000000] max-md:text-xs max-md:leading-normal  transition-colors"
                        >
                          {expandedReplies[comment.id]} Replies (
                          {comment.replies.length})
                          <span
                            className={`transform transition-transform ${expandedReplies[comment.id] ? "rotate-180" : "rotate-0"}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </button>
                      )}

                      {replyingTo === comment.id && (
                        <div className="mt-4 bg-white rounded-lg p-3 ">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center max-md:w-6 max-md:h-6">
                              <span className="text-purple-600 font-semibold text-sm">
                                {currentUser?.name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {!currentUser && (
                                <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-center">
                                  <a
                                    href="/login"
                                    className="text-purple-600 font-semibold hover:underline"
                                  >
                                    Sign in
                                  </a>{" "}
                                  to reply
                                </div>
                              )}
                              {currentUser && (
                                <>
                                  <textarea
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={(e) =>
                                      setReplyContent(e.target.value)
                                    }
                                    className="w-full min-h-[80px] p-3 text-black border border-gray-200 rounded-sm  resize-none text-sm font-normal leading-6 tracking-normal align-middle placeholder:text-[#A4A4A4]"
                                    maxLength={2000}
                                    disabled={submitting}
                                  />
                                  <div className="flex justify-end gap-5 mt-2 px-1 py-2">
                                    <button
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent("");
                                      }}
                                      className="text-[#A4A4A4] text-sm font-medium leading-normal tracking-normal"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSubmitReply(comment.id)
                                      }
                                      className="text-sm font-medium leading-normal tracking-normal bg-gradient-to-b from-[#A941FB] to-[#7864F0EB] bg-clip-text text-transparent disabled:opacity-70 transition-colors"
                                      disabled={
                                        replyContent.trim() === "" || submitting
                                      }
                                    >
                                      {submitting
                                        ? "Posting..."
                                        : "Submit Reply"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {comment.replies?.length > 0 &&
                        expandedReplies[comment.id] && (
                          <div className="space-y-3">
                            {comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="flex gap-3 bg-white !mt-8 rounded-lg max-md:!mt-4"
                              >
                                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center max-md:w-6 max-md:h-6">
                                  {reply.author?.image ? (
                                    <img
                                      src={getAuthorAvatar(reply.author)}
                                      alt={getDisplayName(reply)}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-purple-600 font-semibold text-xs">
                                      {getInitial(reply)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 my-1.5 flex-wrap max-md:my-0">
                                    <span className="font-semibold text-[#14142D] text-sm max-md:text-xs">
                                      {getDisplayName(reply)}
                                    </span>
                                    <span className="text-xs text-[#A4A4A4] max-md:text-[10px]">
                                      {getRelativeTime(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-[#696969] text-sm break-words whitespace-pre-wrap max-md:text-xs">
                                    {reply.content}
                                  </p>
                                  <div className="flex gap-3 text-sm items-center my-3">
                                    {currentUser?.id === reply.authorId && (
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(reply.id)
                                        }
                                        className="text-[#A4A4A4] text-sm font-normal tracking-normal gap-1 flex items-center max-md:text-xs max-md:leading-normal"
                                      >
                                        <img
                                          src="/svg/Commet_delete.svg"
                                          alt="Delete"
                                          className="w-4 h-4"
                                        />
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCommentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
