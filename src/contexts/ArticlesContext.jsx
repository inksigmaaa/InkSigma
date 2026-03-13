"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { blogService } from "@/services/blog.service";
import { useSession } from "@/lib/auth-client";
import { usePublication } from "@/contexts/PublicationContext";

const ArticlesContext = createContext();

// Helper function to format date
const formatDate = (date) => {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  const suffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${day}${suffix(day)} ${month}, ${year}`;
};

// Helper function to convert database blog to article format
const convertBlogToArticle = (blog, includeContent = false) => {
  // Use the status field if available, otherwise derive from published field
  let status = blog.status || (blog.published ? "published" : "draft");

  // Ensure consistency with the publishing logic rules
  if (blog.status) {
    status = blog.status;
  } else {
    // Fallback for backward compatibility
    status = blog.published ? "published" : "draft";
  }

  return {
    id: blog.id,
    title: blog.title,
    description: blog.description,
    content: includeContent ? blog.content : undefined, // Only include content if requested
    categories: blog.categories || [],
    image: blog.image,
    status: status,
    published: blog.published,
    postedTime: `Posted ${formatDate(new Date(blog.createdAt))}`,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    scheduledAt: blog.scheduledAt,
    author: blog.author,
    slug: blog.slug,
    publicationId: blog.publicationId,
    // Use actual values from database, default to 0 if not present
    views: blog.views || 0,
    revisits: blog.revisits || 0,
    comments: blog.comments || 0,
    shares: blog.shares || 0,
  };
};

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [reviewArticles, setReviewArticles] = useState([]);
  const [publicationArticles, setPublicationArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [pubArticlesLoading, setPubArticlesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  // Track continuous loading state for full lists
  const [areUserArticlesLoaded, setAreUserArticlesLoaded] = useState(false);
  const [arePubArticlesLoaded, setArePubArticlesLoaded] = useState(false);
  const { data: session } = useSession();

  // Refs to track current values and abort controllers
  const sessionRef = useRef(session);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const pubAbortControllerRef = useRef(null);

  // Try to get publication context, but handle case where it might not be available
  let currentPublication = null;
  try {
    const pubContext = usePublication();
    currentPublication = pubContext?.currentPublication;
  } catch (e) {
    // PublicationContext not available, will use default behavior
  }

  const currentPublicationRef = useRef(currentPublication);

  // Update refs when values change
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    currentPublicationRef.current = currentPublication;
  }, [currentPublication]);

  // Memoized loadUserArticles to prevent unnecessary re-renders
  const loadUserArticles = useCallback(
    async (
      publicationId = null,
      includeAllPublications = false,
      status = null,
    ) => {
      // Use current session and publication context
      const currentSession = sessionRef.current || session;
      const effectivePublicationId =
        publicationId || currentPublicationRef.current?.id;

      if (!currentSession?.user?.id) {
        return;
      }

      // Abort previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const filters = includeAllPublications
          ? {}
          : effectivePublicationId
            ? { publicationId: effectivePublicationId }
            : { publicationId: null }; // Fixed: Use null instead of "null"

        if (status) {
          filters.status = status;
        }

        const blogs = await blogService.getUserBlogs(
          currentSession.user.id,
          filters,
          { signal: abortControllerRef.current.signal },
        );

        const convertedArticles = blogs.map(convertBlogToArticle);
        setArticles(convertedArticles);
        // Only mark as loaded if we fetched the full list (no status filter)
        if (!status) {
          setAreUserArticlesLoaded(true);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          // Ignore abort errors
          return;
        }
        console.error("Error loading articles:", err);
        setError(err.message);

        if (
          err.message.includes("401") ||
          err.message.includes("Unauthorized")
        ) {
          // Optional hook for auth UI handling in the caller.
        }
      } finally {
        // Only set loading false if this request wasn't aborted
        if (
          abortControllerRef.current &&
          !abortControllerRef.current.signal.aborted
        ) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [session],
  ); // Only depend on session

  // Load articles when session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadUserArticles();
    }
  }, [session?.user?.id, loadUserArticles]);

  // Memoize all functions to prevent unnecessary re-renders
  const getArticleById = useCallback(async (id) => {
    try {
      const blog = await blogService.getBlog(id);
      return convertBlogToArticle(blog, true); // Include content for single article fetch
    } catch (err) {
      console.error("Error loading article:", err);
      throw err;
    }
  }, []);

  const refreshArticle = useCallback(async (id) => {
    try {
      const blog = await blogService.getBlog(id);
      const updatedArticle = convertBlogToArticle(blog);

      setArticles((prev) => {
        const exists = prev.some(
          (article) => String(article.id) === String(id),
        );
        if (exists) {
          return prev.map((article) =>
            String(article.id) === String(id) ? updatedArticle : article,
          );
        } else {
          return [updatedArticle, ...prev];
        }
      });

      setPublicationArticles((prev) => {
        const exists = prev.some(
          (article) => String(article.id) === String(id),
        );
        if (exists) {
          return prev.map((article) =>
            String(article.id) === String(id) ? updatedArticle : article,
          );
        } else {
          return [updatedArticle, ...prev];
        }
      });

      return updatedArticle;
    } catch (err) {
      console.error("Error refreshing article:", err);
      // Suppress error so it doesn't break the caller flow
    }
  }, []);

  const createArticle = useCallback(async (articleData) => {
    try {
      const currentPub = currentPublicationRef.current;

      // publicationId is optional
      const publicationId = articleData.publicationId || currentPub?.id;

      // Determine status based on published flag, defaulting to draft
      let status = "draft";
      if (articleData.published === true) {
        status = "published";
      } else if (articleData.status) {
        status = articleData.status;
      }

      const blogData = {
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        categories: articleData.categories || [],
        status: status,
        scheduledAt: articleData.scheduledAt,
      };

      // Add publicationId only if available
      if (publicationId) {
        blogData.publicationId = publicationId;
      }

      const blog = await blogService.createBlog(blogData);

      const newArticle = convertBlogToArticle(blog);
      setArticles((prev) => [newArticle, ...prev]);
      setPublicationArticles((prev) => [newArticle, ...prev]);
      return newArticle;
    } catch (err) {
      console.error("Error creating article:", err);
      throw err;
    }
  }, []);

  const updateArticle = useCallback(async (id, articleData) => {
    try {
      // Determine status based on published flag or explicit status
      let status = articleData.status;
      if (!status && articleData.published !== undefined) {
        status = articleData.published ? "published" : "draft";
      }

      const blog = await blogService.updateBlog(id, {
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        categories: articleData.categories,
        status: status,
        scheduledAt: articleData.scheduledAt,
      });

      const updatedArticle = convertBlogToArticle(blog);

      // Check if this was a merge (draft ID != returned Master ID)
      if (String(updatedArticle.id) !== String(id)) {
        // It was a merge!
        setArticles((prev) => {
          const withoutDraft = prev.filter((a) => String(a.id) !== String(id));
          return withoutDraft.map((a) =>
            String(a.id) === String(updatedArticle.id) ? updatedArticle : a,
          );
        });
        setPublicationArticles((prev) => {
          const withoutDraft = prev.filter((a) => String(a.id) !== String(id));
          return withoutDraft.map((a) =>
            String(a.id) === String(updatedArticle.id) ? updatedArticle : a,
          );
        });
      } else {
        // Standard update
        setArticles((prev) =>
          prev.map((article) => (article.id === id ? updatedArticle : article)),
        );
        setPublicationArticles((prev) =>
          prev.map((article) => (article.id === id ? updatedArticle : article)),
        );
      }

      return updatedArticle;
    } catch (err) {
      console.error("Error updating article:", err);
      throw err;
    }
  }, []);

  const moveToTrash = useCallback(async (id) => {
    try {
      await blogService.deleteBlog(id);
      setArticles((prev) => prev.filter((article) => article.id !== id));
      setPublicationArticles((prev) =>
        prev.filter((article) => article.id !== id),
      );
    } catch (err) {
      console.error("Error deleting article:", err);
      // Still remove from local state if it's a "not found" error
      if (err.message?.includes("not found")) {
        setArticles((prev) => prev.filter((article) => article.id !== id));
        setPublicationArticles((prev) =>
          prev.filter((article) => article.id !== id),
        );
      } else {
        throw err;
      }
    }
  }, []);

  const moveToDraft = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, "draft");
      const updatedArticle = convertBlogToArticle(blog);

      setArticles((prev) =>
        prev.map((article) => (article.id === id ? updatedArticle : article)),
      );
      setPublicationArticles((prev) =>
        prev.map((article) => (article.id === id ? updatedArticle : article)),
      );

      return updatedArticle;
    } catch (err) {
      console.error("Error moving article to draft:", err);
      throw err;
    }
  }, []);

  const moveToTrashStatus = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, "trash");
      const updatedArticle = convertBlogToArticle(blog);

      setArticles((prev) =>
        prev.map((article) =>
          String(article.id) === String(id) ? updatedArticle : article,
        ),
      );
      setPublicationArticles((prev) =>
        prev.map((article) =>
          String(article.id) === String(id) ? updatedArticle : article,
        ),
      );

      return updatedArticle;
    } catch (err) {
      console.error("Error moving article to trash:", err);
      throw err;
    }
  }, []);

  const publishArticle = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, "published");
      const updatedArticle = convertBlogToArticle(blog);

      // Check if this was a merge (draft ID != returned Master ID)
      if (String(updatedArticle.id) !== String(id)) {
        // It was a merge! We need to:
        // 1. Remove the draft (id)
        // 2. Update the master (updatedArticle.id) with the new data
        setArticles((prev) => {
          // Remove draft
          const withoutDraft = prev.filter((a) => String(a.id) !== String(id));
          // Update master
          return withoutDraft.map((a) =>
            String(a.id) === String(updatedArticle.id) ? updatedArticle : a,
          );
        });

        setPublicationArticles((prev) => {
          // Remove draft
          const withoutDraft = prev.filter((a) => String(a.id) !== String(id));
          // Update master
          return withoutDraft.map((a) =>
            String(a.id) === String(updatedArticle.id) ? updatedArticle : a,
          );
        });
      } else {
        // Standard publish (no merge)
        setArticles((prev) =>
          prev.map((article) =>
            String(article.id) === String(id) ? updatedArticle : article,
          ),
        );
        setPublicationArticles((prev) =>
          prev.map((article) =>
            String(article.id) === String(id) ? updatedArticle : article,
          ),
        );
      }

      return updatedArticle;
    } catch (err) {
      console.error("Error publishing article:", err);
      throw err;
    }
  }, []);

  const unpublishArticle = useCallback(async (id) => {
    try {
      const blog = await blogService.updateBlogStatus(id, "unpublished");
      const updatedArticle = convertBlogToArticle(blog);

      setArticles((prev) =>
        prev.map((article) =>
          String(article.id) === String(id) ? updatedArticle : article,
        ),
      );
      setPublicationArticles((prev) =>
        prev.map((article) =>
          String(article.id) === String(id) ? updatedArticle : article,
        ),
      );

      return updatedArticle;
    } catch (err) {
      console.error("Error unpublishing article:", err);
      throw err;
    }
  }, []);

  const loadReviewArticles = useCallback(async (publicationId) => {
    if (!publicationId) {
      console.warn(
        "[ArticlesContext] No publicationId provided for loadReviewArticles",
      );
      return [];
    }

    try {
      setReviewLoading(true);
      setReviewError(null);

      const blogs = await blogService.getReviewArticles(publicationId);
      const convertedArticles = blogs.map(convertBlogToArticle);
      setReviewArticles(convertedArticles);
      return convertedArticles;
    } catch (err) {
      console.error("Error loading review articles:", err);
      setReviewError(err.message);
      throw err;
    } finally {
      setReviewLoading(false);
    }
  }, []);

  const acceptReviewArticle = useCallback(
    async (id, targetStatus = "unpublished") => {
      try {
        const blog = await blogService.acceptReviewArticle(id, targetStatus);
        const updatedArticle = convertBlogToArticle(blog);

        setReviewArticles((prev) =>
          prev.filter((article) => article.id !== id),
        );

        // Check if this was a merge (draft ID != returned Master ID)
        if (String(updatedArticle.id) !== String(id)) {
          // It was a merge!
          // 1. Remove draft (id) from lists
          setArticles((prev) => {
            const withoutDraft = prev.filter(
              (a) => String(a.id) !== String(id),
            );
            // 2. Update master (updatedArticle.id) if present
            return withoutDraft.map((a) =>
              String(a.id) === String(updatedArticle.id) ? updatedArticle : a,
            );
          });

          setPublicationArticles((prev) => {
            const withoutDraft = prev.filter(
              (a) => String(a.id) !== String(id),
            );
            return withoutDraft.map((a) =>
              String(a.id) === String(updatedArticle.id) ? updatedArticle : a,
            );
          });
        } else {
          // Standard update (no merge)
          setArticles((prev) => {
            const exists = prev.some((article) => article.id === id);
            if (exists) {
              return prev.map((article) =>
                article.id === id ? updatedArticle : article,
              );
            } else {
              return [updatedArticle, ...prev];
            }
          });
          setPublicationArticles((prev) => {
            const exists = prev.some((article) => article.id === id);
            if (exists) {
              return prev.map((article) =>
                article.id === id ? updatedArticle : article,
              );
            } else {
              return [updatedArticle, ...prev];
            }
          });
        }

        return updatedArticle;
      } catch (err) {
        console.error("Error accepting review article:", err);
        throw err;
      }
    },
    [],
  );

  const rejectReviewArticle = useCallback(async (id) => {
    try {
      const blog = await blogService.rejectReviewArticle(id);
      const updatedArticle = convertBlogToArticle(blog);

      setReviewArticles((prev) => prev.filter((article) => article.id !== id));

      setArticles((prev) => {
        const exists = prev.some((article) => article.id === id);
        if (exists) {
          return prev.map((article) =>
            article.id === id ? updatedArticle : article,
          );
        } else {
          return [updatedArticle, ...prev];
        }
      });
      setPublicationArticles((prev) => {
        const exists = prev.some((article) => article.id === id);
        if (exists) {
          return prev.map((article) =>
            article.id === id ? updatedArticle : article,
          );
        } else {
          return [updatedArticle, ...prev];
        }
      });

      return updatedArticle;
    } catch (err) {
      console.error("Error rejecting review article:", err);
      throw err;
    }
  }, []);

  const revertReviewToDraft = useCallback(async (id) => {
    try {
      const blog = await blogService.revertReviewToDraft(id);
      const updatedArticle = convertBlogToArticle(blog);

      setReviewArticles((prev) => prev.filter((article) => article.id !== id));

      setArticles((prev) =>
        prev.map((article) => (article.id === id ? updatedArticle : article)),
      );

      return updatedArticle;
    } catch (err) {
      console.error("Error reverting review article to draft:", err);
      throw err;
    }
  }, []);

  const bulkMoveToTrash = useCallback(async (ids) => {
    try {
      const results = await Promise.allSettled(
        ids.map((id) => blogService.deleteBlog(id)),
      );

      // Convert ids to strings for comparison
      const stringIds = ids.map(String);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(
            `Failed to delete blog ${ids[index]}:`,
            result.reason?.message,
          );
        }
      });

      setArticles((prev) =>
        prev.filter((article) => !stringIds.includes(String(article.id))),
      );
      setPublicationArticles((prev) =>
        prev.filter((article) => !stringIds.includes(String(article.id))),
      );
    } catch (err) {
      console.error("Error bulk deleting articles:", err);
      throw err;
    }
  }, []);

  const bulkMoveToTrashStatus = useCallback(async (ids) => {
    try {
      const updatedBlogs = await Promise.all(
        ids.map((id) => blogService.updateBlogStatus(id, "trash")),
      );
      const updatedArticles = updatedBlogs.map((b) => convertBlogToArticle(b));

      setArticles((prev) =>
        prev.map((article) => {
          const updated = updatedArticles.find(
            (ua) => String(ua.id) === String(article.id),
          );
          return updated || article;
        }),
      );

      setPublicationArticles((prev) =>
        prev.map((article) => {
          const updated = updatedArticles.find(
            (ua) => String(ua.id) === String(article.id),
          );
          return updated || article;
        }),
      );
    } catch (err) {
      console.error("Error bulk moving articles to trash:", err);
      throw err;
    }
  }, []);

  const bulkPublish = useCallback(async (ids) => {
    try {
      const updatedBlogs = await Promise.all(
        ids.map((id) => blogService.updateBlogStatus(id, "published")),
      );
      const updatedArticles = updatedBlogs.map((b) => convertBlogToArticle(b));

      setArticles((prev) =>
        prev.map((article) => {
          const updated = updatedArticles.find(
            (ua) => String(ua.id) === String(article.id),
          );
          return updated || article;
        }),
      );

      setPublicationArticles((prev) =>
        prev.map((article) => {
          const updated = updatedArticles.find(
            (ua) => String(ua.id) === String(article.id),
          );
          return updated || article;
        }),
      );
    } catch (err) {
      console.error("Error bulk publishing articles:", err);
      throw err;
    }
  }, []);

  const bulkMoveToDraft = useCallback(async (ids) => {
    try {
      const updatedBlogs = await Promise.all(
        ids.map((id) => blogService.updateBlogStatus(id, "draft")),
      );
      const updatedArticles = updatedBlogs.map((b) => convertBlogToArticle(b));

      setArticles((prev) =>
        prev.map((article) => {
          const updated = updatedArticles.find(
            (ua) => String(ua.id) === String(article.id),
          );
          return updated || article;
        }),
      );

      setPublicationArticles((prev) =>
        prev.map((article) => {
          const updated = updatedArticles.find(
            (ua) => String(ua.id) === String(article.id),
          );
          return updated || article;
        }),
      );
    } catch (err) {
      console.error("Error bulk moving articles to draft:", err);
      throw err;
    }
  }, []);

  const uploadArticleImage = useCallback(async (id, imageFile) => {
    try {
      if (!imageFile || !(imageFile instanceof File)) {
        throw new Error("Invalid image file provided");
      }

      const result = await blogService.uploadBlogImage(id, imageFile);
      const updatedArticle = convertBlogToArticle(result.blog);
      setArticles((prev) =>
        prev.map((article) => (article.id === id ? updatedArticle : article)),
      );
      return result.imageUrl;
    } catch (err) {
      console.error("Error uploading article image:", err);
      throw err;
    }
  }, []);

  const restoreFromTrash = useCallback((id) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id ? { ...article, status: "draft" } : article,
      ),
    );
  }, []);

  const createDraftFromPublished = useCallback(
    async (id, draftOverrides = {}) => {
      try {
        const { getApiBase } = await import("@/utils/apiBase");
        const API_URL = getApiBase();
        const response = await fetch(`${API_URL}/api/blogs/${id}/edit-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(draftOverrides),
        });

        if (!response.ok) {
          throw new Error("Failed to create draft copy");
        }

        const blog = await response.json();
        const newDraftArticle = convertBlogToArticle(blog);

        setArticles((prev) => [newDraftArticle, ...prev]);
        setPublicationArticles((prev) => [newDraftArticle, ...prev]);

        return newDraftArticle;
      } catch (err) {
        console.error("Error creating draft from published:", err);
        throw err;
      }
    },
    [],
  );

  const addComment = useCallback(async (articleId, commentData) => {
    try {
      const comment = await blogService.addComment(articleId, commentData);
      setArticles((prev) =>
        prev.map((article) =>
          article.id === articleId
            ? { ...article, comments: article.comments + 1 }
            : article,
        ),
      );
      return comment;
    } catch (err) {
      console.error("Error adding comment:", err);
      throw err;
    }
  }, []);

  const deleteArticle = useCallback((id) => {
    setArticles((prev) => prev.filter((article) => article.id !== id));
  }, []);

  const bulkRestore = useCallback((ids) => {
    setArticles((prev) =>
      prev.map((article) =>
        ids.includes(article.id) ? { ...article, status: "draft" } : article,
      ),
    );
  }, []);

  const bulkDelete = useCallback((ids) => {
    setArticles((prev) => prev.filter((article) => !ids.includes(article.id)));
  }, []);

  const loadPublicationArticles = useCallback(
    async (publicationId, status = null) => {
      // Abort previous request if exists
      if (pubAbortControllerRef.current) {
        pubAbortControllerRef.current.abort();
      }
      pubAbortControllerRef.current = new AbortController();

      try {
        setPubArticlesLoading(true);
        const filters = status ? { status } : {};
        const blogs = await blogService.getPublicationBlogs(
          publicationId,
          filters,
          { signal: pubAbortControllerRef.current.signal },
        );
        const convertedArticles = blogs.map(convertBlogToArticle);
        setPublicationArticles(convertedArticles);
        // Only mark as loaded if we fetched the full list (no status filter)
        if (!status) {
          setArePubArticlesLoaded(true);
        }
        return convertedArticles;
      } catch (err) {
        if (err.name === "AbortError") {
          // Ignore abort errors
          return;
        }
        console.error("Error loading publication articles:", err);
        throw err;
      } finally {
        if (
          pubAbortControllerRef.current &&
          !pubAbortControllerRef.current.signal.aborted
        ) {
          setPubArticlesLoading(false);
          pubAbortControllerRef.current = null;
        }
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      articles,
      reviewArticles,
      publicationArticles,
      loading,
      reviewLoading,
      pubArticlesLoading,
      error,
      reviewError,
      loadUserArticles,
      loadReviewArticles,
      loadPublicationArticles,
      getArticleById,
      refreshArticle,
      createArticle,
      updateArticle,
      moveToTrash,
      moveToDraft,
      moveToTrashStatus,
      restoreFromTrash,
      deleteArticle,
      publishArticle,
      unpublishArticle,
      acceptReviewArticle,
      rejectReviewArticle,
      revertReviewToDraft,
      bulkMoveToTrash,
      bulkMoveToTrashStatus,
      bulkMoveToDraft,
      bulkRestore,
      bulkDelete,
      bulkPublish,
      uploadArticleImage,
      createDraftFromPublished,
      addComment,
    }),
    [
      articles,
      reviewArticles,
      publicationArticles,
      loading,
      reviewLoading,
      pubArticlesLoading,
      error,
      reviewError,
      areUserArticlesLoaded,
      arePubArticlesLoaded,
      loadUserArticles,
      loadReviewArticles,
      loadPublicationArticles,
      getArticleById,
      refreshArticle,
      createArticle,
      updateArticle,
      moveToTrash,
      moveToDraft,
      moveToTrashStatus,
      restoreFromTrash,
      deleteArticle,
      publishArticle,
      unpublishArticle,
      acceptReviewArticle,
      rejectReviewArticle,
      revertReviewToDraft,
      bulkMoveToTrash,
      bulkMoveToTrashStatus,
      bulkMoveToDraft,
      bulkRestore,
      bulkDelete,
      bulkPublish,
      uploadArticleImage,
      createDraftFromPublished,
      addComment,
    ],
  );

  return (
    <ArticlesContext.Provider value={contextValue}>
      {children}
    </ArticlesContext.Provider>
  );
}

export function useArticles() {
  const context = useContext(ArticlesContext);
  if (!context) {
    throw new Error("useArticles must be used within ArticlesProvider");
  }
  return context;
}
