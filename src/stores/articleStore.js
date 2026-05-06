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

const normalizeRequestKeyPart = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeRequestKeyPart);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((normalized, key) => {
        normalized[key] = normalizeRequestKeyPart(value[key]);
        return normalized;
      }, {});
  }

  return value;
};

const createRequestKey = (parts) => JSON.stringify(normalizeRequestKeyPart(parts));

const PUBLICATION_ARTICLES_STALE_MS = 60 * 1000;
const USER_ARTICLES_STALE_MS = 60 * 1000;

const articleDetailRequests = new Map();

const mergeCachedArticle = (existing = {}, next = {}) => {
  const cleanNext = Object.fromEntries(
    Object.entries(next).filter(([, value]) => value !== undefined),
  );

  return {
    ...existing,
    ...cleanNext,
    content:
      typeof next.content !== "undefined" ? next.content : existing.content,
    _cachedAt: Date.now(),
    _hasFullContent: typeof next.content !== "undefined",
  };
};

const upsertArticleCache = (cache = {}, articles = []) => {
  const nextCache = { ...cache };
  articles.filter(Boolean).forEach((article) => {
    if (article.id == null) return;
    const key = String(article.id);
    nextCache[key] = mergeCachedArticle(nextCache[key], article);
  });
  return nextCache;
};

const findArticleInLists = (state, id) => {
  const key = String(id);
  return [
    state.articles,
    state.publicationArticles,
    state.reviewArticles,
  ]
    .flat()
    .find((article) => String(article?.id) === key);
};

const hasPublicationArticlesForRequest = (
  articles,
  publicationId,
  status,
) => {
  if (!publicationId || !Array.isArray(articles) || articles.length === 0) {
    return false;
  }

  return articles.some((article) => {
    if (String(article?.publicationId) !== String(publicationId)) {
      return false;
    }

    return !status || article.status === status;
  });
};

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
  editorArticleCache: {},
  areUserArticlesLoaded: false,
  arePubArticlesLoaded: false,
  areReviewArticlesLoaded: false,

  // Internal refs (not reactive — used for abort control)
  _abortController: null,
  _articlesInFlightKey: null,
  _articlesPromise: null,
  _pubAbortController: null,
  _articlesKey: null,
  _articlesLoaded: false,
  _articlesLoadedAt: 0,
  _pubArticlesKey: null,
  _pubArticlesInFlightKey: null,
  _pubArticlesPromise: null,
  _pubArticlesLoaded: false,
  _pubArticlesLoadedAt: 0,
  _reviewArticlesKey: null,
  _reviewArticlesLoaded: false,

  // ── Actions ──

  loadUserArticles: async (
    session,
    publicationId = null,
    includeAllPublications = false,
    status = null,
    extraFilters = {},
    options = {},
  ) => {
    if (!session?.user?.id) return;

    const requestKey = createRequestKey({
      userId: session.user.id,
      publicationId,
      includeAllPublications,
      status,
      extraFilters,
    });
    const state = get();
    const force = options.force === true;
    const inFlightSameRequest =
      state._articlesInFlightKey === requestKey && state._articlesPromise;

    if (inFlightSameRequest) {
      return state._articlesPromise;
    }

    const sameRequest = state._articlesKey === requestKey;
    const hasExistingData =
      sameRequest && (state._articlesLoaded || state.articles.length > 0);
    const hasFreshExistingData =
      hasExistingData &&
      Date.now() - state._articlesLoadedAt < USER_ARTICLES_STALE_MS;

    if (!force && hasFreshExistingData) {
      return state.articles;
    }

    const prev = state._abortController;
    if (prev) prev.abort();
    const controller = new AbortController();

    const requestPromise = (async () => {
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
          editorArticleCache: upsertArticleCache(get().editorArticleCache, converted),
          _articlesKey: requestKey,
          _articlesLoaded: true,
          _articlesLoadedAt: Date.now(),
          ...(status ? {} : { areUserArticlesLoaded: true }),
        });
        return converted;
      } catch (err) {
        if (err.name === "AbortError") return;
        set({ error: err.message });
      } finally {
        if (!controller.signal.aborted) {
          set({
            loading: false,
            refreshing: false,
            _abortController: null,
            _articlesInFlightKey: null,
            _articlesPromise: null,
          });
        }
      }
    })();

    set({
      _abortController: controller,
      _articlesInFlightKey: requestKey,
      _articlesPromise: requestPromise,
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
        editorArticleCache: upsertArticleCache(get().editorArticleCache, converted),
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

  loadPublicationArticles: async (
    publicationId,
    status = null,
    extraFilters = {},
    options = {},
  ) => {
    const requestKey = createRequestKey({
      publicationId,
      status,
      extraFilters,
    });
    const state = get();
    const force = options.force === true;
    const inFlightSameRequest =
      state._pubArticlesInFlightKey === requestKey && state._pubArticlesPromise;

    if (inFlightSameRequest) {
      return state._pubArticlesPromise;
    }

    const sameRequest = state._pubArticlesKey === requestKey;
    const hasExistingData =
      sameRequest &&
      (state._pubArticlesLoaded || state.publicationArticles.length > 0);
    const hasSeedData = hasPublicationArticlesForRequest(
      state.publicationArticles,
      publicationId,
      status,
    );
    const shouldRetainExistingData = hasExistingData || hasSeedData;
    const hasFreshExistingData =
      hasExistingData &&
      Date.now() - state._pubArticlesLoadedAt < PUBLICATION_ARTICLES_STALE_MS;

    const requestPromise = (async () => {
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
          editorArticleCache: upsertArticleCache(get().editorArticleCache, converted),
          _pubArticlesKey: requestKey,
          _pubArticlesLoaded: true,
          _pubArticlesLoadedAt: Date.now(),
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
            _pubArticlesInFlightKey: null,
            _pubArticlesPromise: null,
          });
        }
      }
    })();

    set({
      _pubAbortController: controller,
      _pubArticlesInFlightKey: requestKey,
      _pubArticlesPromise: requestPromise,
      pubArticlesLoading: !shouldRetainExistingData,
      pubArticlesRefreshing: shouldRetainExistingData,
      ...(shouldRetainExistingData ? {} : { publicationArticles: [] }),
    });

    return requestPromise;
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
        editorArticleCache: upsertArticleCache(get().editorArticleCache, converted),
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

  primeEditorArticle: (article) => {
    if (!article?.id) return;
    set((s) => ({
      editorArticleCache: upsertArticleCache(s.editorArticleCache, [article]),
    }));
  },

  primeArticleFromBlog: (blog) => {
    if (!blog?.id) return null;
    const article = convertBlogToArticle(
      blog,
      typeof blog.content !== "undefined",
    );

    set((s) => ({
      articles: upsertInList(s.articles, article.id, article),
      publicationArticles: upsertInList(
        s.publicationArticles,
        article.id,
        article,
      ),
      reviewArticles:
        article.status === "review"
          ? upsertInList(s.reviewArticles, article.id, article)
          : removeFromList(s.reviewArticles, article.id),
      editorArticleCache: upsertArticleCache(s.editorArticleCache, [article]),
    }));

    return article;
  },

  getCachedArticleById: (id) => {
    if (id == null) return null;
    const state = get();
    return state.editorArticleCache[String(id)] || findArticleInLists(state, id) || null;
  },

  prefetchArticle: async (id, seedArticle = null) => {
    if (seedArticle?.id) {
      get().primeEditorArticle(seedArticle);
    }

    const key = String(id);
    const cached = get().getCachedArticleById(id);
    if (cached?._hasFullContent || typeof cached?.content !== "undefined") {
      return cached;
    }

    if (articleDetailRequests.has(key)) {
      return articleDetailRequests.get(key);
    }

    const request = blogService
      .getBlog(id)
      .then((blog) => {
        const fullArticle = convertBlogToArticle(blog, true);
        set((s) => ({
          editorArticleCache: upsertArticleCache(s.editorArticleCache, [
            fullArticle,
          ]),
          articles: updateInList(s.articles, id, fullArticle),
          publicationArticles: updateInList(
            s.publicationArticles,
            id,
            fullArticle,
          ),
          reviewArticles: updateInList(s.reviewArticles, id, fullArticle),
        }));
        return fullArticle;
      })
      .finally(() => {
        articleDetailRequests.delete(key);
      });

    articleDetailRequests.set(key, request);
    return request;
  },

  getArticleById: async (id) => {
    return get().prefetchArticle(id);
  },

  getArticleByIdUncached: async (id) => {
    const blog = await blogService.getBlog(id);
    const fullArticle = convertBlogToArticle(blog, true);
    set((s) => ({
      editorArticleCache: upsertArticleCache(s.editorArticleCache, [
        fullArticle,
      ]),
    }));
    return fullArticle;
  },

  refreshArticle: async (id) => {
    try {
      const blog = await blogService.getBlog(id);
      const updated = convertBlogToArticle(blog);
      set((s) => ({
        articles: upsertInList(s.articles, id, updated),
        publicationArticles: upsertInList(s.publicationArticles, id, updated),
        reviewArticles: updateInList(s.reviewArticles, id, updated),
        editorArticleCache: upsertArticleCache(s.editorArticleCache, [updated]),
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
      editorArticleCache: upsertArticleCache(s.editorArticleCache, [newArticle]),
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
      editorArticleCache: upsertArticleCache(s.editorArticleCache, [updated]),
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
