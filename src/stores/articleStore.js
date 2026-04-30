"use client";

import { create } from "zustand";
import { blogService } from "@/services/blog.service";
import { isArticlePublishable } from "@/utils/articlePublishability";

// ── Helpers (pure, no store dependency) ──

const formatDate = (date) => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

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

const resolveBlogStatus = (blog) => {
  if (blog.status) return blog.status;
  return blog.published ? "published" : "draft";
};

const getDraftMetadata = (blog, status) => {
  const masterId = blog.masterId ?? null;
  const isPublishedCopyDraft = status === "draft" && masterId !== null;
  return {
    masterId,
    draftType: status === "draft"
      ? isPublishedCopyDraft ? "published-copy" : "standard"
      : null,
    isPublishedCopyDraft,
  };
};

const convertBlogToArticle = (blog, includeContent = false) => {
  const status = resolveBlogStatus(blog);
  const draftMetadata = getDraftMetadata(blog, status);
  const publishable = isArticlePublishable({
    title: blog.title,
    description: blog.description,
    content: blog.content,
    isPublishable: blog.isPublishable,
  });

  return {
    id: blog.id,
    title: blog.title,
    description: blog.description,
    content: includeContent ? blog.content : undefined,
    categories: blog.categories || [],
    image: blog.image,
    status,
    published: blog.published,
    postedTime: `Posted ${formatDate(blog.createdAt)}`,
    createdAt: blog.createdAt,
    publishedAt: blog.publishedAt,
    updatedAt: blog.updatedAt,
    scheduledAt: blog.scheduledAt,
    author: blog.author,
    slug: blog.slug,
    publicationId: blog.publicationId,
    ...draftMetadata,
    isPublishable: publishable,
    views: blog.views || 0,
    revisits: blog.revisits || 0,
    comments: blog.comments || 0,
    shares: blog.shares || 0,
  };
};

// ── List-update helpers (reduce duplication) ──

const updateInList = (list, id, updated) =>
  list.map((a) => (String(a.id) === String(id) ? updated : a));

const removeFromList = (list, id) =>
  list.filter((a) => String(a.id) !== String(id));

const upsertInList = (list, id, updated) => {
  const exists = list.some((a) => String(a.id) === String(id));
  return exists ? updateInList(list, id, updated) : [updated, ...list];
};

const handleMerge = (list, draftId, updated) => {
  const withoutDraft = removeFromList(list, draftId);
  return updateInList(withoutDraft, updated.id, updated);
};

const createRequestKey = (parts) => JSON.stringify(parts);

// ── Zustand store ──

export const useArticleStore = create((set, get) => ({
  // ── State ──
  articles: [],
  reviewArticles: [],
  publicationArticles: [],
  loading: false,
  refreshing: false,
  reviewLoading: false,
  reviewRefreshing: false,
  pubArticlesLoading: false,
  pubArticlesRefreshing: false,
  error: null,
  reviewError: null,
  areUserArticlesLoaded: false,
  arePubArticlesLoaded: false,
  areReviewArticlesLoaded: false,

  // Internal refs (not reactive — used for abort control)
  _abortController: null,
  _pubAbortController: null,
  _articlesKey: null,
  _articlesLoaded: false,
  _pubArticlesKey: null,
  _pubArticlesLoaded: false,
  _reviewArticlesKey: null,
  _reviewArticlesLoaded: false,

  // ── Actions ──

  loadUserArticles: async (
    session,
    publicationId = null,
    includeAllPublications = false,
    status = null,
    extraFilters = {},
  ) => {
    if (!session?.user?.id) return;

    // Abort previous request
    const prev = get()._abortController;
    if (prev) prev.abort();
    const controller = new AbortController();
    const requestKey = createRequestKey({
      userId: session.user.id,
      publicationId,
      includeAllPublications,
      status,
      extraFilters,
    });
    const state = get();
    const sameRequest = state._articlesKey === requestKey;
    const hasExistingData =
      sameRequest && (state._articlesLoaded || state.articles.length > 0);
    set({
      _abortController: controller,
      loading: !hasExistingData,
      refreshing: hasExistingData,
      error: null,
      ...(sameRequest ? {} : { articles: [] }),
    });

    try {
      const filters = includeAllPublications
        ? {}
        : publicationId
          ? { publicationId }
          : { publicationId: null };

      if (status) filters.status = status;
      Object.assign(filters, extraFilters);

      const blogs = await blogService.getUserBlogs(
        session.user.id,
        filters,
        { signal: controller.signal },
      );

      const converted = blogs.map(convertBlogToArticle);
      set({
        articles: converted,
        _articlesKey: requestKey,
        _articlesLoaded: true,
        ...(status ? {} : { areUserArticlesLoaded: true }),
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      set({ error: err.message });
    } finally {
      if (!controller.signal.aborted) {
        set({
          loading: false,
          refreshing: false,
          _abortController: null,
        });
      }
    }
  },

  loadPublicationArticles: async (publicationId, status = null, extraFilters = {}) => {
    const prev = get()._pubAbortController;
    if (prev) prev.abort();
    const controller = new AbortController();
    const requestKey = createRequestKey({
      publicationId,
      status,
      extraFilters,
    });
    const state = get();
    const sameRequest = state._pubArticlesKey === requestKey;
    const hasExistingData =
      sameRequest &&
      (state._pubArticlesLoaded || state.publicationArticles.length > 0);
    set({
      _pubAbortController: controller,
      pubArticlesLoading: !hasExistingData,
      pubArticlesRefreshing: hasExistingData,
      ...(sameRequest ? {} : { publicationArticles: [] }),
    });

    try {
      const filters = status ? { status } : {};
      Object.assign(filters, extraFilters);
      const blogs = await blogService.getPublicationBlogs(
        publicationId,
        filters,
        { signal: controller.signal },
      );
      const converted = blogs.map(convertBlogToArticle);
      set({
        publicationArticles: converted,
        _pubArticlesKey: requestKey,
        _pubArticlesLoaded: true,
        ...(status ? {} : { arePubArticlesLoaded: true }),
      });
      return converted;
    } catch (err) {
      if (err.name === "AbortError") return;
      throw err;
    } finally {
      if (!controller.signal.aborted) {
        set({
          pubArticlesLoading: false,
          pubArticlesRefreshing: false,
          _pubAbortController: null,
        });
      }
    }
  },

  loadReviewArticles: async (publicationId, options = {}) => {
    if (!publicationId) return [];
    const requestKey = createRequestKey({ publicationId });
    const state = get();
    const sameRequest = state._reviewArticlesKey === requestKey;
    const hasExistingData =
      sameRequest &&
      (state._reviewArticlesLoaded || state.reviewArticles.length > 0);
    const shouldBlock = !options.background && !hasExistingData;
    set({
      reviewLoading: shouldBlock,
      reviewRefreshing: !shouldBlock,
      reviewError: null,
      ...(sameRequest ? {} : { reviewArticles: [] }),
    });
    try {
      const blogs = await blogService.getReviewArticles(publicationId);
      const converted = blogs.map(convertBlogToArticle);
      set({
        reviewArticles: converted,
        areReviewArticlesLoaded: true,
        _reviewArticlesKey: requestKey,
        _reviewArticlesLoaded: true,
      });
      return converted;
    } catch (err) {
      set({ reviewError: err.message });
      throw err;
    } finally {
      set({ reviewLoading: false, reviewRefreshing: false });
    }
  },

  getArticleById: async (id) => {
    const blog = await blogService.getBlog(id);
    return convertBlogToArticle(blog, true);
  },

  refreshArticle: async (id) => {
    try {
      const blog = await blogService.getBlog(id);
      const updated = convertBlogToArticle(blog);
      set((s) => ({
        articles: upsertInList(s.articles, id, updated),
        publicationArticles: upsertInList(s.publicationArticles, id, updated),
      }));
      return updated;
    } catch {
      // Suppress — don't break caller flow
    }
  },

  createArticle: async (articleData, currentPublicationId) => {
    const publicationId = articleData.publicationId || currentPublicationId;
    let status = "draft";
    if (articleData.published === true) status = "published";
    else if (articleData.status) status = articleData.status;

    const blogData = {
      title: articleData.title,
      description: articleData.description,
      content: articleData.content,
      categories: articleData.categories || [],
      status,
      scheduledAt: articleData.scheduledAt,
    };
    if (publicationId) blogData.publicationId = publicationId;

    const blog = await blogService.createBlog(blogData);
    const newArticle = convertBlogToArticle(blog);
    set((s) => ({
      articles: [newArticle, ...s.articles],
      publicationArticles: [newArticle, ...s.publicationArticles],
    }));
    return newArticle;
  },

  updateArticle: async (id, articleData) => {
    let status = articleData.status;
    if (!status && articleData.published !== undefined) {
      status = articleData.published ? "published" : "draft";
    }

    const blog = await blogService.updateBlog(id, {
      title: articleData.title,
      description: articleData.description,
      content: articleData.content,
      categories: articleData.categories,
      status,
      scheduledAt: articleData.scheduledAt,
    });

    const updated = convertBlogToArticle(blog);
    const wasMerge = String(updated.id) !== String(id);

    set((s) => ({
      articles: wasMerge
        ? handleMerge(s.articles, id, updated)
        : updateInList(s.articles, id, updated),
      publicationArticles: wasMerge
        ? handleMerge(s.publicationArticles, id, updated)
        : updateInList(s.publicationArticles, id, updated),
    }));
    return updated;
  },

  moveToTrash: async (id) => {
    try {
      await blogService.deleteBlog(id);
    } catch (err) {
      if (!err.message?.includes("not found")) throw err;
    }
    set((s) => ({
      articles: removeFromList(s.articles, id),
      publicationArticles: removeFromList(s.publicationArticles, id),
    }));
  },

  moveToDraft: async (id) => {
    const blog = await blogService.updateBlogStatus(id, "draft");
    const updated = convertBlogToArticle(blog);
    set((s) => ({
      articles: updateInList(s.articles, id, updated),
      publicationArticles: updateInList(s.publicationArticles, id, updated),
    }));
    return updated;
  },

  moveToTrashStatus: async (id) => {
    const blog = await blogService.updateBlogStatus(id, "trash");
    const updated = convertBlogToArticle(blog);
    set((s) => ({
      articles: updateInList(s.articles, id, updated),
      publicationArticles: updateInList(s.publicationArticles, id, updated),
    }));
    return updated;
  },

  publishArticle: async (id) => {
    const blog = await blogService.updateBlogStatus(id, "published");
    const updated = convertBlogToArticle(blog);
    const wasMerge = String(updated.id) !== String(id);
    set((s) => ({
      articles: wasMerge
        ? handleMerge(s.articles, id, updated)
        : updateInList(s.articles, id, updated),
      publicationArticles: wasMerge
        ? handleMerge(s.publicationArticles, id, updated)
        : updateInList(s.publicationArticles, id, updated),
    }));
    return updated;
  },

  unpublishArticle: async (id) => {
    const blog = await blogService.updateBlogStatus(id, "unpublished");
    const updated = convertBlogToArticle(blog);
    set((s) => ({
      articles: updateInList(s.articles, id, updated),
      publicationArticles: updateInList(s.publicationArticles, id, updated),
    }));
    return updated;
  },

  acceptReviewArticle: async (id, targetStatus = "unpublished") => {
    const blog = await blogService.acceptReviewArticle(id, targetStatus);
    const updated = convertBlogToArticle(blog);
    const wasMerge = String(updated.id) !== String(id);
    set((s) => ({
      reviewArticles: removeFromList(s.reviewArticles, id),
      articles: wasMerge
        ? handleMerge(s.articles, id, updated)
        : upsertInList(s.articles, id, updated),
      publicationArticles: wasMerge
        ? handleMerge(s.publicationArticles, id, updated)
        : upsertInList(s.publicationArticles, id, updated),
    }));
    return updated;
  },

  rejectReviewArticle: async (id) => {
    const blog = await blogService.rejectReviewArticle(id);
    const updated = convertBlogToArticle(blog);
    set((s) => ({
      reviewArticles: removeFromList(s.reviewArticles, id),
      articles: upsertInList(s.articles, id, updated),
      publicationArticles: upsertInList(s.publicationArticles, id, updated),
    }));
    return updated;
  },

  revertReviewToDraft: async (id) => {
    const blog = await blogService.revertReviewToDraft(id);
    const updated = convertBlogToArticle(blog);
    set((s) => ({
      reviewArticles: removeFromList(s.reviewArticles, id),
      articles: updateInList(s.articles, id, updated),
    }));
    return updated;
  },

  bulkMoveToTrash: async (ids) => {
    await Promise.allSettled(ids.map((id) => blogService.deleteBlog(id)));
    const stringIds = new Set(ids.map(String));
    set((s) => ({
      articles: s.articles.filter((a) => !stringIds.has(String(a.id))),
      publicationArticles: s.publicationArticles.filter((a) => !stringIds.has(String(a.id))),
    }));
  },

  bulkMoveToTrashStatus: async (ids) => {
    const updatedBlogs = await Promise.all(
      ids.map((id) => blogService.updateBlogStatus(id, "trash")),
    );
    const map = new Map(updatedBlogs.map((b) => [String(convertBlogToArticle(b).id), convertBlogToArticle(b)]));
    set((s) => ({
      articles: s.articles.map((a) => map.get(String(a.id)) || a),
      publicationArticles: s.publicationArticles.map((a) => map.get(String(a.id)) || a),
    }));
  },

  bulkPublish: async (ids) => {
    const updatedBlogs = await Promise.all(
      ids.map((id) => blogService.updateBlogStatus(id, "published")),
    );
    const map = new Map(updatedBlogs.map((b) => [String(convertBlogToArticle(b).id), convertBlogToArticle(b)]));
    set((s) => ({
      articles: s.articles.map((a) => map.get(String(a.id)) || a),
      publicationArticles: s.publicationArticles.map((a) => map.get(String(a.id)) || a),
    }));
  },

  bulkMoveToDraft: async (ids) => {
    const updatedBlogs = await Promise.all(
      ids.map((id) => blogService.updateBlogStatus(id, "draft")),
    );
    const map = new Map(updatedBlogs.map((b) => [String(convertBlogToArticle(b).id), convertBlogToArticle(b)]));
    set((s) => ({
      articles: s.articles.map((a) => map.get(String(a.id)) || a),
      publicationArticles: s.publicationArticles.map((a) => map.get(String(a.id)) || a),
    }));
  },

  uploadArticleImage: async (id, imageFile) => {
    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("Invalid image file provided");
    }
    const result = await blogService.uploadBlogImage(id, imageFile);
    const updated = convertBlogToArticle(result.blog);
    set((s) => ({
      articles: updateInList(s.articles, id, updated),
      publicationArticles: updateInList(s.publicationArticles, id, updated),
      reviewArticles: updateInList(s.reviewArticles, id, updated),
    }));
    return result.image || updated.image || null;
  },

  restoreFromTrash: (id) => {
    set((s) => ({
      articles: s.articles.map((a) =>
        a.id === id ? { ...a, status: "draft" } : a,
      ),
    }));
  },

  createDraftFromPublished: async (id, draftOverrides = {}) => {
    const { getApiBase } = await import("@/utils/apiBase");
    const API_URL = getApiBase();
    const response = await fetch(`${API_URL}/api/blogs/${id}/edit-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(draftOverrides),
    });
    if (!response.ok) throw new Error("Failed to create draft copy");
    const blog = await response.json();
    const newDraft = convertBlogToArticle(blog);
    set((s) => ({
      articles: [newDraft, ...s.articles],
      publicationArticles: [newDraft, ...s.publicationArticles],
    }));
    return newDraft;
  },

  addComment: async (articleId, commentData) => {
    const comment = await blogService.addComment(articleId, commentData);
    set((s) => ({
      articles: s.articles.map((a) =>
        a.id === articleId ? { ...a, comments: a.comments + 1 } : a,
      ),
    }));
    return comment;
  },

  deleteArticle: (id) => {
    set((s) => ({
      articles: removeFromList(s.articles, id),
    }));
  },

  bulkRestore: (ids) => {
    set((s) => ({
      articles: s.articles.map((a) =>
        ids.includes(a.id) ? { ...a, status: "draft" } : a,
      ),
    }));
  },

  bulkDelete: (ids) => {
    set((s) => ({
      articles: s.articles.filter((a) => !ids.includes(a.id)),
    }));
  },
}));
