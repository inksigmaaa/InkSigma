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

// ── Zustand store ──

export const useArticleStore = create((set, get) => ({
  // ── State ──
  articles: [],
  reviewArticles: [],
  publicationArticles: [],
  loading: false,
  reviewLoading: false,
  pubArticlesLoading: false,
  pubArticlesLoadingMore: false,
  error: null,
  reviewError: null,
  areUserArticlesLoaded: false,
  arePubArticlesLoaded: false,
  hasMorePubArticles: true,        // pagination: are there more articles to load?
  _pubArticlesOffset: 0,           // pagination: current offset
  _PUB_PAGE_SIZE: 50,              // matches backend DEFAULT_BLOG_PAGE_SIZE

  // Internal refs (not reactive — used for abort control & staleness)
  _abortController: null,
  _pubAbortController: null,
  _userArticlesFetchedAt: 0,       // timestamp of last successful user articles fetch
  _userArticlesCacheKey: null,     // "pubId:status" key for cache hit comparison
  _pubArticlesFetchedAt: 0,        // timestamp of last successful pub articles fetch
  _pubArticlesCacheKey: null,      // "pubId:status" key for cache hit comparison
  _STALE_MS: 30_000,              // 30s staleness window — skip re-fetch if fresh

  // ── Actions ──

  loadUserArticles: async (
    session,
    publicationId = null,
    includeAllPublications = false,
    status = null,
    extraFilters = {},
    { force = false } = {},
  ) => {
    if (!session?.user?.id) return;

    // ── Staleness gate: skip if same params fetched recently ──
    const cacheKey = `user:${publicationId}:${status}:${includeAllPublications}`;
    const state = get();
    if (
      !force &&
      state._userArticlesCacheKey === cacheKey &&
      state.areUserArticlesLoaded &&
      Date.now() - state._userArticlesFetchedAt < state._STALE_MS
    ) {
      return state.articles;
    }

    // Abort previous request
    const prev = state._abortController;
    if (prev) prev.abort();
    const controller = new AbortController();
    set({ _abortController: controller, loading: true, error: null });

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
        _userArticlesFetchedAt: Date.now(),
        _userArticlesCacheKey: cacheKey,
        ...(status ? {} : { areUserArticlesLoaded: true }),
      });
      return converted;
    } catch (err) {
      if (err.name === "AbortError") return;
      set({ error: err.message });
    } finally {
      if (!controller.signal.aborted) {
        set({ loading: false, _abortController: null });
      }
    }
  },

  loadPublicationArticles: async (publicationId, status = null, extraFilters = {}, { force = false } = {}) => {
    // ── Staleness gate: skip if same params fetched recently ──
    const cacheKey = `pub:${publicationId}:${status}`;
    const state = get();
    if (
      !force &&
      state._pubArticlesCacheKey === cacheKey &&
      state.arePubArticlesLoaded &&
      Date.now() - state._pubArticlesFetchedAt < state._STALE_MS
    ) {
      return state.publicationArticles;
    }

    const prev = state._pubAbortController;
    if (prev) prev.abort();
    const controller = new AbortController();
    set({ _pubAbortController: controller, pubArticlesLoading: true });

    try {
      const pageSize = state._PUB_PAGE_SIZE;
      const filters = status ? { status, limit: pageSize, offset: 0 } : { limit: pageSize, offset: 0 };
      Object.assign(filters, extraFilters);
      const blogs = await blogService.getPublicationBlogs(
        publicationId,
        filters,
        { signal: controller.signal },
      );
      const converted = blogs.map(convertBlogToArticle);
      set({
        publicationArticles: converted,
        _pubArticlesFetchedAt: Date.now(),
        _pubArticlesCacheKey: cacheKey,
        _pubArticlesOffset: converted.length,
        hasMorePubArticles: blogs.length >= pageSize,
        ...(status ? {} : { arePubArticlesLoaded: true }),
      });
      return converted;
    } catch (err) {
      if (err.name === "AbortError") return;
      throw err;
    } finally {
      if (!controller.signal.aborted) {
        set({ pubArticlesLoading: false, _pubAbortController: null });
      }
    }
  },

  // ── Load next page of publication articles (append to existing list) ──
  loadMorePublicationArticles: async (publicationId, status = null, extraFilters = {}) => {
    const state = get();
    if (!state.hasMorePubArticles || state.pubArticlesLoadingMore) return;

    set({ pubArticlesLoadingMore: true });

    try {
      const pageSize = state._PUB_PAGE_SIZE;
      const filters = status
        ? { status, limit: pageSize, offset: state._pubArticlesOffset }
        : { limit: pageSize, offset: state._pubArticlesOffset };
      Object.assign(filters, extraFilters);

      const blogs = await blogService.getPublicationBlogs(publicationId, filters);
      const converted = blogs.map(convertBlogToArticle);

      set((s) => ({
        publicationArticles: [...s.publicationArticles, ...converted],
        _pubArticlesOffset: s._pubArticlesOffset + converted.length,
        hasMorePubArticles: blogs.length >= pageSize,
      }));
      return converted;
    } catch (err) {
      console.error("Error loading more articles:", err);
      throw err;
    } finally {
      set({ pubArticlesLoadingMore: false });
    }
  },

  loadReviewArticles: async (publicationId) => {
    if (!publicationId) return [];
    set({ reviewLoading: true, reviewError: null });
    try {
      const blogs = await blogService.getReviewArticles(publicationId);
      const converted = blogs.map(convertBlogToArticle);
      set({ reviewArticles: converted });
      return converted;
    } catch (err) {
      set({ reviewError: err.message });
      throw err;
    } finally {
      set({ reviewLoading: false });
    }
  },

  // ── Invalidate staleness so the next page load re-fetches ──
  _invalidateCache: () => {
    set({
      _userArticlesFetchedAt: 0,
      _userArticlesCacheKey: null,
      _pubArticlesFetchedAt: 0,
      _pubArticlesCacheKey: null,
    });
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
    get()._invalidateCache();
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
    get()._invalidateCache();
  },

  moveToDraft: async (id) => {
    // ── Optimistic: update UI immediately, rollback on error ──
    const snapshot = { articles: get().articles, publicationArticles: get().publicationArticles };
    set((s) => ({
      articles: updateInList(s.articles, id, { ...s.articles.find((a) => String(a.id) === String(id)), status: "draft" }),
      publicationArticles: updateInList(s.publicationArticles, id, { ...s.publicationArticles.find((a) => String(a.id) === String(id)), status: "draft" }),
    }));

    try {
      const blog = await blogService.updateBlogStatus(id, "draft");
      const updated = convertBlogToArticle(blog);
      set((s) => ({
        articles: updateInList(s.articles, id, updated),
        publicationArticles: updateInList(s.publicationArticles, id, updated),
      }));
      return updated;
    } catch (err) {
      set(snapshot); // rollback
      throw err;
    }
  },

  moveToTrashStatus: async (id) => {
    // ── Optimistic: update UI immediately, rollback on error ──
    const snapshot = { articles: get().articles, publicationArticles: get().publicationArticles };
    set((s) => ({
      articles: updateInList(s.articles, id, { ...s.articles.find((a) => String(a.id) === String(id)), status: "trash" }),
      publicationArticles: updateInList(s.publicationArticles, id, { ...s.publicationArticles.find((a) => String(a.id) === String(id)), status: "trash" }),
    }));

    try {
      const blog = await blogService.updateBlogStatus(id, "trash");
      const updated = convertBlogToArticle(blog);
      set((s) => ({
        articles: updateInList(s.articles, id, updated),
        publicationArticles: updateInList(s.publicationArticles, id, updated),
      }));
      return updated;
    } catch (err) {
      set(snapshot); // rollback
      throw err;
    }
  },

  publishArticle: async (id) => {
    // ── Optimistic: update UI immediately, rollback on error ──
    const snapshot = { articles: get().articles, publicationArticles: get().publicationArticles };
    set((s) => ({
      articles: updateInList(s.articles, id, { ...s.articles.find((a) => String(a.id) === String(id)), status: "published" }),
      publicationArticles: updateInList(s.publicationArticles, id, { ...s.publicationArticles.find((a) => String(a.id) === String(id)), status: "published" }),
    }));

    try {
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
      get()._invalidateCache();
      return updated;
    } catch (err) {
      set(snapshot); // rollback
      throw err;
    }
  },

  unpublishArticle: async (id) => {
    // ── Optimistic: update UI immediately, rollback on error ──
    const snapshot = { articles: get().articles, publicationArticles: get().publicationArticles };
    set((s) => ({
      articles: updateInList(s.articles, id, { ...s.articles.find((a) => String(a.id) === String(id)), status: "unpublished" }),
      publicationArticles: updateInList(s.publicationArticles, id, { ...s.publicationArticles.find((a) => String(a.id) === String(id)), status: "unpublished" }),
    }));

    try {
      const blog = await blogService.updateBlogStatus(id, "unpublished");
      const updated = convertBlogToArticle(blog);
      set((s) => ({
        articles: updateInList(s.articles, id, updated),
        publicationArticles: updateInList(s.publicationArticles, id, updated),
      }));
      get()._invalidateCache();
      return updated;
    } catch (err) {
      set(snapshot); // rollback
      throw err;
    }
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
    get()._invalidateCache();
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
    get()._invalidateCache();
    return updated;
  },

  revertReviewToDraft: async (id) => {
    const blog = await blogService.revertReviewToDraft(id);
    const updated = convertBlogToArticle(blog);
    set((s) => ({
      reviewArticles: removeFromList(s.reviewArticles, id),
      articles: updateInList(s.articles, id, updated),
    }));
    get()._invalidateCache();
    return updated;
  },

  bulkMoveToTrash: async (ids) => {
    await Promise.allSettled(ids.map((id) => blogService.deleteBlog(id)));
    const stringIds = new Set(ids.map(String));
    set((s) => ({
      articles: s.articles.filter((a) => !stringIds.has(String(a.id))),
      publicationArticles: s.publicationArticles.filter((a) => !stringIds.has(String(a.id))),
    }));
    get()._invalidateCache();
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
    get()._invalidateCache();
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
    get()._invalidateCache();
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
    get()._invalidateCache();
  },

  uploadArticleImage: async (id, imageFile) => {
    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("Invalid image file provided");
    }
    const result = await blogService.uploadBlogImage(id, imageFile);
    const updated = convertBlogToArticle(result.blog);
    set((s) => ({
      articles: updateInList(s.articles, id, updated),
    }));
    return result.imageUrl;
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
    get()._invalidateCache();
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
