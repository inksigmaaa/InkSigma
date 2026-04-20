"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { getApiBase } from "@/utils/apiBase";
import { getImageUrl } from "@/utils/imageUrl";
import { buildDashboardLoginUrlForViewSite } from "@/utils/publicSiteAuth";
import {
  buildPublicSiteApiUrl,
  clearInvalidPublicSiteAuth,
  withPublicSiteAuth,
} from "@/utils/publicSiteApi";
import { consumePublicSiteAuthTokenFromUrl } from "@/utils/publicSiteSession";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = getApiBase();

const readFreshUserData = () => {
  if (typeof window === "undefined") return null;

  const storedValue = window.localStorage.getItem("freshUserData");
  if (!storedValue) return null;

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error("[CommentSection] Failed to parse freshUserData:", error);
    return null;
  }
};

const mergeUserData = (sessionUser, profileUser) => {
  if (!sessionUser && !profileUser) return null;

  if (!sessionUser && profileUser) {
    return {
      ...profileUser,
      id: profileUser.id,
      name: profileUser.profileName || profileUser.name || "User",
      username: profileUser.username || "",
      image: profileUser.image || profileUser.avatar || profileUser.picture || profileUser.photo,
      avatar: profileUser.avatar || null,
      picture: profileUser.picture || null,
      photo: profileUser.photo || null,
    };
  }

  return {
    ...sessionUser,
    ...(profileUser && {
      name: profileUser.profileName || profileUser.name || sessionUser.name,
      username: profileUser.username || sessionUser.username,
      image:
        profileUser.image ||
        sessionUser.image ||
        sessionUser.avatar ||
        sessionUser.picture ||
        sessionUser.photo,
      avatar: profileUser.avatar || sessionUser.avatar,
      picture: profileUser.picture || sessionUser.picture,
      photo: profileUser.photo || sessionUser.photo,
    }),
  };
};

const readFreshUserData = () => {
  if (typeof window === "undefined") return null;

  const storedValue = window.localStorage.getItem("freshUserData");
  if (!storedValue) return null;

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error("[CommentSection] Failed to parse freshUserData:", error);
    return null;
  }
};

const mergeUserData = (sessionUser, profileUser) => {
  if (!sessionUser) return null;

  return {
    ...sessionUser,
    ...(profileUser && {
      name: profileUser.profileName || profileUser.name || sessionUser.name,
      username: profileUser.username || sessionUser.username,
      image:
        profileUser.image ||
        sessionUser.image ||
        sessionUser.avatar ||
        sessionUser.picture ||
        sessionUser.photo,
      avatar: profileUser.avatar || sessionUser.avatar,
      picture: profileUser.picture || sessionUser.picture,
      photo: profileUser.photo || sessionUser.photo,
    }),
  };
};

import { formatTimeAgo } from "../../../../utils/timeFormatter";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import { toast } from "sonner";
import { flushSync } from "react-dom";

export default function CommentSection({ blogId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Guest fields removed as per requirement
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [currentTime, setCurrentTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [freshProfile, setFreshProfile] = useState(null);
  const { data: session, isPending: sessionPending } = useSession();
  const currentUser = mergeUserData(session?.user || null, freshProfile);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!blogId) return;

    try {
      setLoading(true);
      const response = await fetch(buildPublicSiteApiUrl(`/comments/blog/${blogId}`));
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

  useEffect(() => {
    consumePublicSiteAuthTokenFromUrl();
  }, []);

  useEffect(() => {
    const sessionUserId = session?.user?.id;
    if (!sessionUserId) {
      setFreshProfile(null);
      // Continue: a public-site auth token may still be present on custom domains.
    }

    let isActive = true;
    const controller = new AbortController();

    const syncStoredProfile = () => {
      const storedProfile = readFreshUserData();
      if (storedProfile && isActive) {
        setFreshProfile(storedProfile);
      }
    };

    const fetchFreshProfile = async () => {
      try {
        const response = await fetch(
          buildPublicSiteApiUrl("/profile"),
          withPublicSiteAuth({
            credentials: "include",
            signal: controller.signal,
          }),
        );

        clearInvalidPublicSiteAuth(response);

        if (!response.ok) {
          if (response.status === 401) {
            setFreshProfile(null);
          }
          return;
        }

        const profile = await response.json();
        if (isActive) {
          setFreshProfile(profile);
        }
      } catch (fetchError) {
        if (fetchError?.name === "AbortError") return;
        console.error(
          "[CommentSection] Failed to refresh current user profile:",
          fetchError,
        );
      }
    };

    const handleStorageChange = (event) => {
      if (event.key !== "freshUserData" && event.key !== "profileUpdated") {
        return;
      }

      syncStoredProfile();
      fetchFreshProfile();
    };

    syncStoredProfile();
    fetchFreshProfile();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      isActive = false;
      controller.abort();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!currentUser) return;

    setShowAuthModal(false);
  }, [currentUser]);

  const openAuthModal = () => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleAuthModalOpenChange = (open) => {
    if (open) {
      openAuthModal();
      return;
    }

    closeAuthModal();
  };

  const handleGuestCommentIntent = (event) => {
    if (currentUser || sessionPending) return;

    event.target.blur();
    openAuthModal();
  };

  const redirectToDashboardLogin = () => {
    if (typeof window === "undefined") return;
    window.location.assign(buildDashboardLoginUrlForViewSite());
  };

  // Update exactly on minute boundaries so "x min ago" changes on time.
  useEffect(() => {
    let intervalId;
    const updateNow = () => setCurrentTime(Date.now());

    updateNow();

    const now = Date.now();
    const msUntilNextMinute = 60000 - (now % 60000);

    const timeoutId = setTimeout(() => {
      updateNow();
      intervalId = setInterval(updateNow, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleSubmitComment = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (!newComment.trim()) {
      setError("Please enter a comment");
      return;
    }
    if (sessionPending) {
      setError("Checking sign-in status. Please try again.");
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
        buildPublicSiteApiUrl("/comments"),
      );
      console.log("[CommentSection] Request body:", {
        ...body,
        content: body.content.substring(0, 50) + "...",
      });

      const response = await fetch(
        buildPublicSiteApiUrl("/comments"),
        withPublicSiteAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }),
      );

      clearInvalidPublicSiteAuth(response);

      console.log("[CommentSection] Response status:", response.status);
      console.log("[CommentSection] Response ok:", response.ok);
      console.log("[CommentSection] Response headers:", {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });

      if (response.ok) {
        const comment = await response.json();
        console.log("[CommentSection] New comment created:", comment);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("blog:comment-will-add"));
        }
        flushSync(() => {
          setComments((prev) => [comment, ...prev]);
        });

        setNewComment("");
        setError(null);
        toast.success("Comment added successfully");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("blog:comment-did-add"));
        }
      } else {
        let errorMessage = "Failed to post comment";
        let responseData = null;

        if (response.status === 401) {
          openAuthModal();
        }

        try {
          responseData = await response.json();
          console.error("[CommentSection] Error response data:", responseData);
          errorMessage =
            responseData.error || responseData.message || errorMessage;
          if (errorMessage === "Name is required for guest comments") {
            errorMessage = "Please sign in to comment";
          }
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
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("[CommentSection] Fetch error:", err);
      console.error("[CommentSection] Error type:", err?.constructor?.name);
      console.error("[CommentSection] Error message:", err?.message);
      setError("Failed to post comment. Please try again.");
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (!replyContent.trim()) {
      setError("Please enter a reply");
      return;
    }
    if (sessionPending) {
      setError("Checking sign-in status. Please try again.");
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

      const response = await fetch(
        buildPublicSiteApiUrl("/comments"),
        withPublicSiteAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }),
      );

      clearInvalidPublicSiteAuth(response);

      if (response.ok) {
        const reply = await response.json();
        console.log("[CommentSection] New reply created:", reply);
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c,
          ),
        );
        setReplyContent("");
        setReplyingTo(null);
        setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
        setError(null);
        toast.success("Reply added successfully");
      } else {
        let errorMessage = "Failed to post reply";
        if (response.status === 401) {
          openAuthModal();
        }
        try {
          const data = await response.json();
          console.error("[CommentSection] Failed to post reply:", data);
          errorMessage = data.error || data.message || errorMessage;
          if (errorMessage === "Name is required for guest comments") {
            errorMessage = "Please sign in to reply";
          }
        } catch (parseErr) {
          console.error(
            "[CommentSection] Failed to parse error response:",
            parseErr,
          );
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      setError("Failed to post reply. Please try again.");
      toast.error("Failed to post reply. Please try again.");
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
        buildPublicSiteApiUrl(`/comments/${commentToDelete}`),
        withPublicSiteAuth({
          method: "DELETE",
          credentials: "include",
        }),
      );

      clearInvalidPublicSiteAuth(response);

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
        toast.success("Comment deleted successfully");
      } else {
        if (response.status === 401) {
          openAuthModal();
        }
        const data = await response.json();
        setError(data.error || "Failed to delete comment");
        toast.error(data.error || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
      toast.error("Failed to delete comment");
    } finally {
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplyClick = (commentId) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const getAuthorAvatar = (author) => {
    const rawAvatar =
      author?.image || author?.avatar || author?.picture || author?.photo;

    if (typeof rawAvatar !== "string" || rawAvatar.trim() === "") return null;

    const trimmedAvatar = rawAvatar.trim();
    const normalizedAvatar = getImageUrl(trimmedAvatar);
    if (normalizedAvatar) return normalizedAvatar;

    return `${BACKEND_URL}${trimmedAvatar.startsWith("/") ? "" : "/"}${trimmedAvatar}`;
  };

  const getDisplayName = (comment) => {
    if (comment.author?.name) return comment.author.name;
    if (comment.guestName) return comment.guestName;
    return "Guest";
  };

  const getInitial = (comment) => {
    const name = getDisplayName(comment);
    return name.charAt(0).toUpperCase();
  };

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0,
  );
  const currentUserAvatar = getAuthorAvatar(currentUser);
  const currentUserName = currentUser?.name || "User";
  const currentUserInitial = currentUserName.charAt(0).toUpperCase() || "?";

  return (
    <div className="mt-12">
      <Dialog open={showAuthModal} onOpenChange={handleAuthModalOpenChange}>
        <DialogContent className="max-w-[420px] rounded-2xl border-0 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-[22px] font-semibold leading-tight text-[#14142D]">
              Login to comment
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#696969]">
              Authentication is handled on the InkSigma dashboard so your
              session cookie is created on the correct domain. Continue to log
              in there, then you&apos;ll be sent back to this blog page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              type="button"
              onClick={redirectToDashboardLogin}
              className="h-11 w-full border-0 bg-[#080808] text-white hover:bg-[#1C1C1C]"
            >
              Continue to login
            </Button>

            <div className="rounded-lg border border-[#EAEAEA] bg-[#F8F8F8] px-4 py-3 text-sm text-[#696969]">
              Use your existing InkSigma login page for email/password or Google
              sign-in. That flow already handles session creation, verification,
              and redirects correctly.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="my-6 ">
        <h2 className="text-base font-semibold leading-6 tracking-normal text-[#14142D] mb-6 max-md:text-sm max-md:pt-5 max-md:border-t max-md:border-[#EDEDED] ">
          How useful was this blog?
        </h2>
        <div
          className={`flex mb-6 ${currentUser ? "gap-3 md:gap-4" : "gap-0"}`}
        >
          {currentUser && (
            <Avatar className="w-8 h-8 bg-purple-100 flex-shrink-0 max-md:w-6 max-md:h-6">
              {currentUserAvatar && (
                <AvatarImage
                  src={currentUserAvatar}
                  alt={currentUserName}
                  className="w-full h-full object-cover"
                />
              )}
              <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold">
                {currentUserInitial}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <textarea
              placeholder={
                currentUser
                  ? "Share your thoughts..."
                  : "Click here to login and share your thoughts..."
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={handleGuestCommentIntent}
              className="w-full min-h-[94px] p-4 border-[1px] border-[#EAEAEA] rounded-sm focus:outline-none focus:border-[#EAEAEA] resize-none text-black text-sm md:text-base placeholder:text-[#A4A4A4] placeholder:text-base placeholder:font-normal placeholder:leading-6 placeholder:tracking-normal placeholder:align-middle max-md:text-xs max-md:py-2 placeholder:max-md:text-xs"
              maxLength={2000}
              disabled={submitting}
              readOnly={!currentUser}
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
                    <Avatar className="w-8 h-8 bg-purple-100 flex-shrink-0 max-md:w-6 max-md:h-6">
                      {getAuthorAvatar(comment.author) && (
                        <AvatarImage
                          src={getAuthorAvatar(comment.author)}
                          alt={getDisplayName(comment)}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold">
                        {getInitial(comment)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 my-1.5 flex-wrap max-md:my-0">
                        <span className="text-[#404040] text-sm font-semibold leading-5 tracking-normal max-md:text-xs">
                          {getDisplayName(comment)}
                        </span>
                        <span className="text-[#A4A4A4] text-xs font-normal leading-5 tracking-normal max-md:text-[10px]">
                          {currentTime ? formatTimeAgo(comment.createdAt, currentTime) : "Just now"}
                        </span>
                      </div>

                      <p className="text-[#696969] text-sm font-normal leading-5 tracking-normal mt-1 break-words whitespace-pre-wrap max-md:text-xs max-md:leading-normal">
                        {comment.content}
                      </p>

                      <div className="flex gap-4 text-sm items-center my-3">
                        <button
                          onClick={() => handleReplyClick(comment.id)}
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
                            <Avatar className="w-8 h-8 flex-shrink-0 max-md:w-6 max-md:h-6">
                              {currentUserAvatar && (
                                <AvatarImage
                                  src={currentUserAvatar}
                                  alt={currentUserName}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold text-sm">
                                {currentUserInitial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
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
                                <Avatar className="w-8 h-8 flex-shrink-0 max-md:w-6 max-md:h-6">
                                  {getAuthorAvatar(reply.author) && (
                                    <AvatarImage
                                      src={getAuthorAvatar(reply.author)}
                                      alt={getDisplayName(reply)}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                  <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold text-xs">
                                    {getInitial(reply)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 my-1.5 flex-wrap max-md:my-0">
                                    <span className="font-semibold text-[#14142D] text-sm max-md:text-xs">
                                      {getDisplayName(reply)}
                                    </span>
                                    <span className="text-xs text-[#A4A4A4] max-md:text-[10px]">
                                      {currentTime ? formatTimeAgo(reply.createdAt, currentTime) : "Just now"}
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
