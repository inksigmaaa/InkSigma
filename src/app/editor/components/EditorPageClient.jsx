"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Calendar10 from "@/components/calendar10";
import EditorCategoryDropdown from "./EditorCategoryDropdown";
import { ThumbnailModal } from "./ThumbnailModal";
import PublishSuccessModal from "./PublishSuccessModal";
import ExitConfirmModal from "./ExitConfirmModal";
import ConfirmModal from "@/components/features/confirmModal/ConfirmModal";
import { useArticles } from "@/contexts/ArticlesContext";
import { useSession } from "@/lib/auth-client";
import { usePublication } from "@/contexts/PublicationContext";
import { toast } from "sonner";

import {
  Image as ImageIcon,
  ChevronLeft,
  FileText,
} from "lucide-react";

import { TiptapEditor } from "./TiptapEditor";
import { useAutoSave } from "./hooks/useAutoSave";
import {
  clearRecoverableDraft,
  getRecoverableDraft,
  isUnsyncedDraft,
  readPersistedDraftId,
} from "./services/DraftRecoveryService";
import { getApiBase } from "@/utils/apiBase";
import SaveStatusIndicator from "./SaveStatusIndicator";
import EditorPageStyles from "./EditorPageStyles";
import EditorStatsBar from "./EditorStatsBar";
import EditorFooterActions from "./EditorFooterActions";
import EditorContentSkeleton from "./EditorContentSkeleton";
import {
  DEFAULT_DRAFT_TITLE,
  LEGACY_DRAFT_TITLE,
  isArticlePublishable,
} from "@/utils/articlePublishability";
import { getPublicationPageUrl } from "@/utils/publicationDomain";

const API_URL = getApiBase();
const LOCAL_DRAFT_PROMPT_STATUSES = new Set([
  "published",
  "scheduled",
  "review",
  "unpublished",
  "trash",
]);

export default function EditorPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const {
    createArticle,
    updateArticle,
    uploadArticleImage,
    getArticleByIdUncached,
    getCachedArticleById,
    loadUserArticles,
    createDraftFromPublished,
    primeArticleFromBlog,
    refreshArticle,
  } = useArticles();
  const { currentPublication } = usePublication();
  const pubPrefix = currentPublication?.subdomain
    ? `/${currentPublication.subdomain}`
    : "";

  const withPub = useCallback(
    (path) => {
      if (!path?.startsWith?.("/")) return path;
      if (!pubPrefix) return path;
      // Avoid double-prefixing.
      return path.startsWith(pubPrefix) ? path : `${pubPrefix}${path}`;
    },
    [pubPrefix],
  );

  // Prevent hydration mismatch by ensuring client-side rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get status and ID from URL parameters
  const articleStatus = searchParams.get("status");
  const articleId = searchParams.get("id");
  const blogId = articleId; // Alias for backward compatibility
  const publicationId = searchParams.get("publicationId"); // For joined publications
  const [currentBlogId, setCurrentBlogId] = useState(blogId);
  const [editorRenderKey, setEditorRenderKey] = useState(blogId || "new");
  const promotedBlogIdRef = useRef(null);

  useEffect(() => {
    const nextBlogId = blogId || null;
    if (promotedBlogIdRef.current === nextBlogId) {
      promotedBlogIdRef.current = null;
      setCurrentBlogId(nextBlogId);
      return;
    }
    if (nextBlogId === (currentBlogId || null)) return;

    setCurrentBlogId(nextBlogId);
    setEditorRenderKey(nextBlogId || "new");
  }, [blogId, currentBlogId]);

  // Determine if user is owner or member
  const isPublicationOwner = currentPublication?.isOwner ?? true; // Default to true if no publication context

  // Check if user has a publication, redirect to create one if not
  useEffect(() => {
    const checkPublication = async () => {
      if (!session?.user?.id) return;

      // If we already have a publication from context or URL, no need to check
      if (currentPublication?.id || publicationId) return;

      try {
        // Use the unified "owned + joined" endpoint so members don't get treated as new users.
        const response = await fetch(
          `${API_URL}/api/members/user/publications`,
          {
            credentials: "include",
          },
        );

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          console.warn(
            "[Editor] Failed to check publications:",
            response.status,
          );
          return;
        }

        const data = await response.json().catch(() => null);
        const publications = Array.isArray(data)
          ? data
          : data?.publications || [];
        const hasAny = Array.isArray(publications) && publications.length > 0;

        if (!hasAny) {
          router.push("/create-publication");
        }
      } catch (error) {
        console.error("Error checking publication:", error);
      }
    };

    checkPublication();
  }, [session?.user?.id, currentPublication?.id, publicationId, router]);

  // State management
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [thumbnailData, setThumbnailData] = useState(null);
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const [thumbnailStatus, setThumbnailStatus] = useState("idle");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [editorContent, setEditorContent] = useState({
    charCount: 0,
    wordCount: 0,
    html: "",
    text: "",
  });
  const editorContentRef = useRef(editorContent);
  const applyingRemoteArticleRef = useRef(false);
  const bodyEditedSinceLoadRef = useRef(false);
  const lastAppliedRemoteContentRef = useRef("");

  const updateEditorContent = useCallback((data) => {
    editorContentRef.current = data;
    setEditorContent(data);
  }, []);

  const handleEditorUpdate = useCallback((data) => {
    if (
      !applyingRemoteArticleRef.current &&
      data.html !== lastAppliedRemoteContentRef.current
    ) {
      bodyEditedSinceLoadRef.current = true;
    }
    updateEditorContent(data);
  }, [updateEditorContent]);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogDescription, setBlogDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [publishedBlogSlug, setPublishedBlogSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialContent, setInitialContent] = useState("");
  const [existingBlogStatus, setExistingBlogStatus] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDraftConfirmModal, setShowDraftConfirmModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [pendingRecoveryDraft, setPendingRecoveryDraft] = useState(null);
  const [exitDestination, setExitDestination] = useState(null); // 'published', 'drafts', 'home'
  const scheduleMinDate = new Date();
  scheduleMinDate.setHours(0, 0, 0, 0);
  const scheduleCurrentYear = scheduleMinDate.getFullYear();
  const scheduleYearInputUpperBound = scheduleCurrentYear + 2;
  const calendarRef = useRef(null);
  const handlingPopStateRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const editorInstanceRef = useRef(null); // Ref to TipTap editor for uncontrolled reads
  const shadowIdRef = useRef(null); // Server-created ID stored silently during auto-save (no re-render)
  const localDraftWinsRef = useRef(false);
  const newArticleRecoveryCheckedRef = useRef(false);
  const publishCompletedRef = useRef(false);
  const thumbnailDataRef = useRef(thumbnailData); // Always-current thumbnail data for async callbacks
  thumbnailDataRef.current = thumbnailData;
  const syncExtraDirtySignalRef = useRef(null); // Filled after useAutoSave — avoids declaration-order issue
  const initialBlogIdRef = useRef(blogId); // The blogId from the URL at mount time
  const thumbnailDirtySignal = thumbnailRemoved
    ? "removed"
    : thumbnailData?.file
      ? `file:${thumbnailData.file.name}:${thumbnailData.file.size}:${thumbnailData.file.lastModified}`
      : thumbnailData?.url
        ? `url:${thumbnailData.url}`
        : "none";
  const hasThumbnailDraftData = Boolean(thumbnailRemoved || thumbnailData?.file);

  const persistThumbnailForBlog = useCallback(
    async (
      blogIdToUpload,
      nextThumbnailData,
      { showSuccessToast = false, showErrorToast = true } = {},
    ) => {
      if (!nextThumbnailData?.file) {
        return nextThumbnailData?.url || null;
      }
      if (!blogIdToUpload) {
        throw new Error("Draft must be created before uploading the thumbnail");
      }

      setThumbnailStatus("uploading");

      try {
        const uploadedImageUrl = await uploadArticleImage(
          blogIdToUpload,
          nextThumbnailData.file,
        );

        setThumbnailData((current) => {
          const source = current?.file ? current : nextThumbnailData;
          return source
            ? {
                ...source,
                file: null,
                url: uploadedImageUrl,
                previewUrl: uploadedImageUrl,
              }
            : {
                url: uploadedImageUrl,
                previewUrl: uploadedImageUrl,
              };
        });
        setThumbnailRemoved(false);
        setThumbnailStatus("uploaded");

        if (showSuccessToast) {
          toast.success("Thumbnail uploaded");
        }

        return uploadedImageUrl;
      } catch (error) {
        setThumbnailStatus("error");

        if (showErrorToast) {
          toast.error(error.message || "Failed to upload thumbnail");
        }

        throw error;
      }
    },
    [uploadArticleImage],
  );

  // Handle See Later - after successful publish, go straight to publication posts.
  const handleSeeLater = async () => {
    markNavigating();
    setShowPublishSuccess(false);
    setPendingRecoveryDraft(null);
    setShowRecoveryModal(false);
    router.replace(withPub("/published"));
  };

  // Handle View in Site - open blog in new tab ONLY
  const handleViewInSite = () => {
    const blogUrl = currentPublication
      ? getPublicationPageUrl(
          currentPublication,
          publishedBlogSlug ? `/blog/${publishedBlogSlug}` : "/",
        )
      : publishedBlogSlug
        ? `/view-site/blog/${publishedBlogSlug}`
        : publicationId
          ? `/view-site?publicationId=${publicationId}`
          : "/view-site";

    // Open blog in new tab
    window.open(blogUrl, "_blank");
  };

  // Handle Close Modal - redirect to home
  const handleClosePublishModal = () => {
    markNavigating();

    setShowPublishSuccess(false);

    router.replace(withPub("/home"));
  };

  // ── Auto-save via custom hook ───────────────────────────────────────────
  const getCurrentEditorContent = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return editorContentRef.current;

    const html = editor.getHTML();
    const text = editor.getText();

    return {
      html,
      text,
      charCount: text.length,
      wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
    };
  }, []);

  const saveFnForHook = useCallback(
    async (isAutoSave) => {
      return saveBlog("draft", null, true, isAutoSave);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentBlogId,
      blogTitle,
      blogDescription,
      editorContent.html,
      selectedCategories,
      existingBlogStatus,
      publicationId,
      currentPublication,
      thumbnailRemoved,
      thumbnailData,
    ],
  );

  const replaceEditorUrlId = useCallback((newId, nextStatus = "draft") => {
    if (!newId) return;

    const nextId = String(newId);
    promotedBlogIdRef.current = nextId;
    setCurrentBlogId((current) => current || nextId);

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("id", nextId);
    if (!url.searchParams.get("status")) {
      url.searchParams.set("status", nextStatus);
    }
    if (publicationId) {
      url.searchParams.set("publicationId", publicationId);
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [publicationId]);

  // Callback for when the first server save creates a new blog ID.
  // Promote the draft into the URL immediately so refresh always reopens it.
  const handleBlogIdCreated = useCallback((result) => {
    if (result?.id != null) {
      const newId = String(result.id);
      shadowIdRef.current = newId;
      replaceEditorUrlId(newId);

      // If the user selected a thumbnail before the blog existed, upload it now.
      const pending = thumbnailDataRef.current;
      if (pending?.file) {
        persistThumbnailForBlog(newId, pending, {
          showSuccessToast: false,
          showErrorToast: true,
        })
          .then((url) => {
            if (url) syncExtraDirtySignalRef.current?.(`url:${url}`);
          })
          .catch(() => {
            // Error already handled inside persistThumbnailForBlog (toast + status)
          });
      }
    }
  }, [persistThumbnailForBlog, replaceEditorUrlId]);

  // Promote shadowIdRef to state + URL (called on manual save / publish / exit)
  const flushShadowId = useCallback(() => {
    if (shadowIdRef.current && !currentBlogId) {
      const newId = shadowIdRef.current;
      replaceEditorUrlId(newId);
      shadowIdRef.current = null;
    }
  }, [currentBlogId, replaceEditorUrlId]);

  const {
    hasUnsavedChanges,
    saveStatus,
    setSaveStatus,
    isAutoSaving,
    markSaved,
    markPublishing,
    markNavigating,
    cancelPendingAutoSave,
    resetSnapshot,
    syncExtraDirtySignal,
    clearDraft,
    getDexieId,
  } = useAutoSave({
    currentBlogId,
    shadowId: shadowIdRef.current,
    title: blogTitle,
    description: blogDescription,
    contentHtml: editorContent.html,
    categories: selectedCategories,
    existingBlogStatus,
    publicationId,
    currentPublication,
    isSaving,
    saveFn: saveFnForHook,
    onBlogIdCreated: handleBlogIdCreated,
    extraDirtySignal: thumbnailDirtySignal,
    hasAdditionalDraftData: hasThumbnailDraftData,
  });
  syncExtraDirtySignalRef.current = syncExtraDirtySignal;

  // Derived: does the editor have any content at all?
  const hasContent =
    blogTitle.trim() ||
    blogDescription.trim() ||
    (editorContent.html && editorContent.html !== "<p></p>") ||
    thumbnailData ||
    thumbnailRemoved;

  const restoreLocalDraft = useCallback((draft) => {
    if (!draft) return;

    const nextContent = draft.content || "";
    const nextText = nextContent
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim();

    setBlogTitle(draft.title || "");
    setBlogDescription(draft.description || "");
    setSelectedCategories(Array.isArray(draft.categories) ? draft.categories : []);
    lastAppliedRemoteContentRef.current = nextContent;
    setInitialContent(nextContent);
    updateEditorContent({
      html: nextContent,
      text: nextText,
      charCount: nextText.length,
      wordCount: nextText ? nextText.split(/\s+/).length : 0,
    });
    setExistingBlogStatus((current) => current || "draft");

    if (editorInstanceRef.current) {
      editorInstanceRef.current.commands.setContent(nextContent || "");
    }
  }, [updateEditorContent]);

  const applyLocalDraftRecovery = useCallback((draft) => {
    if (!draft) return;
    restoreLocalDraft(draft);
    bodyEditedSinceLoadRef.current = true;
    localDraftWinsRef.current = true;
    setIsLoading(false);
  }, [restoreLocalDraft]);

  const handleRestoreRecoveryDraft = useCallback(() => {
    applyLocalDraftRecovery(pendingRecoveryDraft);
    setPendingRecoveryDraft(null);
    setShowRecoveryModal(false);
    toast.success("Unsaved local changes restored");
  }, [applyLocalDraftRecovery, pendingRecoveryDraft]);

  const handleDiscardRecoveryDraft = useCallback(async () => {
    const draftId = pendingRecoveryDraft?.postId;
    if (draftId) {
      await clearRecoverableDraft(draftId);
    }
    setPendingRecoveryDraft(null);
    setShowRecoveryModal(false);
    toast.success("Unsaved local changes discarded");
  }, [pendingRecoveryDraft]);

  const applyArticleToEditor = useCallback(
    (article, { resetDirtySnapshot = true, updateBody = true } = {}) => {
      if (!article) return;

      const normalizedTitle = (article.title || "").trim().toLowerCase();
      const displayTitle =
        normalizedTitle === DEFAULT_DRAFT_TITLE.toLowerCase() ||
        normalizedTitle === LEGACY_DRAFT_TITLE
          ? ""
          : article.title || "";
      const contentHtml =
        typeof article.content === "string" ? article.content : "";
      const contentText = contentHtml
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .trim();

      applyingRemoteArticleRef.current = true;

      setBlogTitle(displayTitle);
      setBlogDescription(article.description || "");
      setSelectedCategories(Array.isArray(article.categories) ? article.categories : []);
      setExistingBlogStatus(article.status);

      if (updateBody) {
        lastAppliedRemoteContentRef.current = contentHtml;
        setInitialContent(contentHtml);
        updateEditorContent({
          html: contentHtml,
          text: contentText,
          charCount: contentText.length,
          wordCount: contentText ? contentText.split(/\s+/).length : 0,
        });

        if (editorInstanceRef.current) {
          editorInstanceRef.current.commands.setContent(contentHtml || "");
        }
      }

      if (resetDirtySnapshot) {
        resetSnapshot({
          title: displayTitle,
          description: article.description || "",
          contentHtml,
          categories: article.categories || [],
          extraDirtySignal: article.image ? `url:${article.image}` : "none",
        });
      }

      if (article.image) {
        setThumbnailData({ url: article.image, previewUrl: article.image });
        setThumbnailRemoved(false);
        setThumbnailStatus("uploaded");
      } else {
        setThumbnailData(null);
        setThumbnailRemoved(false);
        setThumbnailStatus("idle");
      }

      if (article.scheduledAt) {
        const scheduledDate = new Date(article.scheduledAt);
        const normalizedDate = new Date(scheduledDate);
        normalizedDate.setHours(0, 0, 0, 0);
        const formattedDate = `${String(normalizedDate.getDate()).padStart(2, "0")}-${String(
          normalizedDate.getMonth() + 1,
        ).padStart(2, "0")}-${normalizedDate.getFullYear()}`;
        const formattedTime = `${String(scheduledDate.getHours()).padStart(2, "0")}:${String(
          scheduledDate.getMinutes(),
        ).padStart(2, "0")}`;
        setSelectedDate(normalizedDate);
        setSelectedTime(formattedTime);
        setDateInput(formattedDate);
        setTimeInput(formattedTime);
        setDateError("");
        setTimeError("");
      } else {
        setSelectedDate(null);
        setSelectedTime(null);
        setDateInput("");
        setTimeInput("");
        setDateError("");
        setTimeError("");
      }

      window.setTimeout(() => {
        applyingRemoteArticleRef.current = false;
      }, 0);
    },
    [resetSnapshot, updateEditorContent],
  );

  // Load existing blog if editing.
  // Guard: only load when the blogId comes from the initial URL, not when
  // shadowIdRef gets promoted to state/URL after a manual save.
  const loadExistingBlog = useCallback(async (id) => {
    bodyEditedSinceLoadRef.current = false;
    localDraftWinsRef.current = false;
    setPendingRecoveryDraft(null);
    setShowRecoveryModal(false);

    const cachedArticle = getCachedArticleById?.(id);
    const hasCachedBody = typeof cachedArticle?.content === "string";
    let localDraft = null;
    let localDraftRecoveryHandled = false;

    if (cachedArticle) {
      applyArticleToEditor(cachedArticle, {
        resetDirtySnapshot: true,
        updateBody: hasCachedBody,
      });
    }

    setIsLoading(!hasCachedBody);

    try {
      localDraft = await getRecoverableDraft({ blogId: id });
    } catch (error) {
      console.warn("[Editor] Failed to read local draft recovery:", error);
    }

    const handleLocalDraftRecovery = (status) => {
      if (!localDraft || localDraftRecoveryHandled) {
        return false;
      }
      if (!status) {
        return false;
      }

      const shouldPrompt = LOCAL_DRAFT_PROMPT_STATUSES.has(status);
      localDraftRecoveryHandled = true;

      if (shouldPrompt) {
        setPendingRecoveryDraft(localDraft);
        setShowRecoveryModal(true);
        return false;
      }

      applyLocalDraftRecovery(localDraft);
      return true;
    };

    const knownStatus =
      cachedArticle?.status || articleStatus || existingBlogStatus;
    if (handleLocalDraftRecovery(knownStatus)) {
      setIsLoading(false);
    }

    const timingLabel = `[Editor] loadExistingBlog:${id}`;
    if (process.env.NODE_ENV !== "production") {
      console.time(timingLabel);
    }

    try {
      const article = await getArticleByIdUncached(id);
      if (handleLocalDraftRecovery(article?.status)) {
        return;
      }

      if (
        localDraftWinsRef.current ||
        (bodyEditedSinceLoadRef.current && hasCachedBody)
      ) {
        return;
      }

      applyArticleToEditor(article, {
        resetDirtySnapshot: true,
        updateBody: true,
      });
    } catch (error) {
      console.error("Error loading blog:", error);
      // alert(`Failed to load blog: ${error.message}`)
    } finally {
      if (process.env.NODE_ENV !== "production") {
        console.timeEnd(timingLabel);
      }
      setIsLoading(false);
    }
  }, [
    applyArticleToEditor,
    applyLocalDraftRecovery,
    articleStatus,
    existingBlogStatus,
    getArticleByIdUncached,
    getCachedArticleById,
  ]);

  useEffect(() => {
    if (blogId && blogId === initialBlogIdRef.current) {
      loadExistingBlog(blogId);
    } else if (blogId && blogId !== initialBlogIdRef.current) {
      // Shadow ID was just promoted — update the ref but don't reload
      initialBlogIdRef.current = blogId;
    }
  }, [blogId, isMounted, getDexieId, loadExistingBlog]);

  useEffect(() => {
    if (
      !isMounted ||
      blogId ||
      newArticleRecoveryCheckedRef.current ||
      publishCompletedRef.current
    ) {
      return;
    }

    let cancelled = false;
    newArticleRecoveryCheckedRef.current = true;

    const recoverNewArticleDraft = async () => {
      const tempDraftId = readPersistedDraftId(publicationId);
      if (!tempDraftId) return;

      try {
        const draft = await getRecoverableDraft({ tempDraftId });
        if (cancelled || !draft || !isUnsyncedDraft(draft)) return;

        applyLocalDraftRecovery(draft);
      } catch (error) {
        console.warn("[Editor] Failed to recover new local draft:", error);
      }
    };

    recoverNewArticleDraft();

    return () => {
      cancelled = true;
    };
  }, [applyLocalDraftRecovery, blogId, isMounted, publicationId]);

  // Save blog to database (create new or update existing)
  const saveBlog = async (
    status,
    scheduledAt = null,
    skipValidation = false,
    isAutoSave = false,
  ) => {
    const currentEditorContent = getCurrentEditorContent();
    const currentContentHtml = currentEditorContent.html || "";

    const hasBodyContent = (() => {
      const html = currentContentHtml;
      if (!html) return false;
      if (/<img\b[^>]*>/i.test(html)) return true;
      const plainText = html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .trim();
      return plainText.length > 0;
    })();

    const requiresSubmissionFields = [
      "published",
      "scheduled",
      "review",
    ].includes(status);
    const submissionActionLabel =
      status === "published"
        ? "publishing"
        : status === "scheduled"
          ? "scheduling"
          : "sending for review";

    // For auto-saves, skip if a manual save is already in flight
    if (isAutoSave && (isSaving || saveInFlightRef.current)) {
      return { skipped: true };
    }

    // Always validate required fields for submission statuses.
    if (requiresSubmissionFields) {
      if (!blogTitle.trim()) {
        toast.error(`Title is required before ${submissionActionLabel}`);
        return false;
      }
      if (!blogDescription.trim()) {
        toast.error(`Description is required before ${submissionActionLabel}`);
        return false;
      }
      if (!hasBodyContent) {
        toast.error(`Content is required before ${submissionActionLabel}`);
        return false;
      }
    }

    // Existing draft-only validation behavior.
    if (!skipValidation && !currentBlogId) {
      if (!blogTitle.trim()) {
        toast.error("Please enter a title for your blog");
        return false;
      }
      if (!blogDescription.trim()) {
        toast.error("Please enter a description for your blog");
        return false;
      }
    }

    // Only set isSaving for manual saves (to avoid disabling publish button)
    if (!isAutoSave) {
      cancelPendingAutoSave();
      if (isSaving) return false;
      setIsSaving(true);
      setSaveStatus("saving");
    }

    saveInFlightRef.current = true;

    try {
      updateEditorContent(currentEditorContent);

      const blogData = {
        title: blogTitle,
        description: blogDescription,
        content: currentContentHtml,
        categories: selectedCategories,
        status: status,
        published: status === "published",
      };

      // Add publicationId if available
      const pubId = publicationId || currentPublication?.id;
      const parsedPublicationId = Number(pubId);
      if (Number.isInteger(parsedPublicationId) && parsedPublicationId > 0) {
        blogData.publicationId = parsedPublicationId;
      }

      // Add scheduledAt if scheduling
      if (scheduledAt) {
        blogData.scheduledAt = scheduledAt.toISOString();
      }

      if (thumbnailRemoved) {
        blogData.image = null;
      }

      // Use PUT for updates, POST for new blogs.
      // Check shadowIdRef first — it holds the server ID from a previous auto-save
      // that hasn't been promoted to state yet.
      const effectiveId = currentBlogId || shadowIdRef.current;
      const url = effectiveId
        ? `${API_URL}/api/blogs/${effectiveId}`
        : `${API_URL}/api/blogs`;
      const method = effectiveId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(blogData),
      });

      const contentType = response.headers.get("content-type") || "";
      let responseData = null;

      if (contentType.includes("application/json")) {
        responseData = await response.json().catch(() => null);
      } else {
        const text = await response.text();
        responseData = { error: text };
      }

      if (!response.ok) {
        const errMsg =
          responseData?.error ||
          responseData?.message ||
          responseData?.details ||
          `Failed to save blog (${response.status})`;
        console.error("[saveBlog] request failed:", {
          url,
          method,
          status: response.status,
          effectiveId,
          isAutoSave,
          responseData,
        });
        throw new Error(errMsg);
      }

      // When a new blog is created for the first time:
      if (!effectiveId && responseData?.id != null) {
        if (isAutoSave) {
          // Auto-save: silently store in shadowIdRef — no state change, no URL change, no re-render
          shadowIdRef.current = String(responseData.id);
        } else {
          // Manual save: promote to state + URL immediately
          replaceEditorUrlId(responseData.id, status);
        }
      }

      // On manual save, flush any previously shadow-stored ID
      if (!isAutoSave && shadowIdRef.current && !currentBlogId) {
        flushShadowId();
      }

      let thumbnailUploadFailed = false;
      let persistedThumbnailUrl = null;
      const persistedBlogId = responseData?.id ?? effectiveId;
      let nextThumbnailSignal = thumbnailDirtySignal;

      // Upload thumbnail if one was selected
      if (thumbnailData && thumbnailData.file) {
        try {
          const uploadedImageUrl = await persistThumbnailForBlog(
            persistedBlogId,
            thumbnailData,
            {
              showSuccessToast: false,
              showErrorToast: !isAutoSave,
            },
          );
          persistedThumbnailUrl = uploadedImageUrl || null;
          nextThumbnailSignal = uploadedImageUrl
            ? `url:${uploadedImageUrl}`
            : "none";
        } catch (error) {
          console.error("Error uploading thumbnail:", error);
          thumbnailUploadFailed = true;
        }
      } else if (thumbnailRemoved) {
        setThumbnailStatus("removed");
        nextThumbnailSignal = "removed";
      } else if (thumbnailData?.url) {
        nextThumbnailSignal = `url:${thumbnailData.url}`;
      }

      // Tell the hook the save succeeded. Preserve thumbnail dirty state if upload failed.
      const savedSnapshot = {
        title: blogTitle,
        description: blogDescription,
        contentHtml: currentContentHtml,
        categories: selectedCategories,
        extraDirtySignal: thumbnailUploadFailed
          ? thumbnailDirtySignal
          : nextThumbnailSignal,
      };
      markSaved({
        preserveExtraDirty: thumbnailUploadFailed,
        nextExtraDirtySignal: nextThumbnailSignal,
        savedSnapshot,
      });
      if (!isAutoSave) {
        setSaveStatus(thumbnailUploadFailed ? "failed" : "saved");
        if (thumbnailUploadFailed) {
          toast.error(
            "Article saved, but the thumbnail upload failed. Please retry the thumbnail.",
          );
        }
      }

      if (responseData?.id && !isAutoSave) {
        primeArticleFromBlog({
          ...responseData,
          ...(persistedThumbnailUrl ? { image: persistedThumbnailUrl } : {}),
        });
      }

      // Auto-save should stay best-effort and quiet. The list pages already refresh
      // themselves, so avoid a blocking read that can surface transient 404s.
      if (responseData?.id && !isAutoSave) {
        refreshArticle(responseData.id).catch((err) =>
          console.error("Failed to refresh article context:", err),
        );
      }

      if (thumbnailUploadFailed) {
        return {
          ...(responseData || {}),
          thumbnailUploadFailed: true,
          __savedSnapshot: savedSnapshot,
        };
      }

      return {
        ...(responseData || {}),
        __savedSnapshot: savedSnapshot,
      };
    } catch (error) {
      console.error("Error saving blog:", error);
      if (isAutoSave) {
        throw error;
      }
      setSaveStatus("idle");
      toast.error(error.message || "Failed to save blog");
      return false;
    } finally {
      saveInFlightRef.current = false;
      if (!isAutoSave) {
        setIsSaving(false);
      }
    }
  };

  // Handle Save to Draft (without redirect - just save and stay on page)
  const handleSave = async () => {
    const result = await saveBlog(existingBlogStatus || "draft", null, true);
    if (result) {
      toast.success("Article updated successfully");
      if (existingBlogStatus === "published") {
        router.replace(withPub("/published"));
      }
    }
  };

  // Handle Save to Draft (with redirect)
  const handleSaveDraft = async () => {
    await performSaveAndExit("/draft", false);
  };

  // Execute Revert to Draft (actual logic)
  const executeDraft = async () => {
    try {
      setIsSaving(true);

      // Gather current editor state
      const currentEditorContent = getCurrentEditorContent();
      updateEditorContent(currentEditorContent);
      const draftData = {
        title: `${blogTitle} [Update draft]`,
        description: blogDescription,
        content: currentEditorContent.html,
        categories: selectedCategories,
        // image is handled separately via thumbnailData/thumbnailRemoved if needed,
        // but for now we'll stick to text content to be safe.
        // If thumbnail was changed but not saved to the original, we might need to handle it,
        // but image upload usually happens immediately on selection or save.
      };

      // Create a draft copy of the current published article with CURRENT edits
      const newDraft = await createDraftFromPublished(currentBlogId, draftData);

      if (newDraft && newDraft.id) {
        toast.success("Saved current changes as a new draft");
        markNavigating();
        setShowDraftConfirmModal(false); // Close modal

        // Exit the editor -> Go to drafts list
        router.replace(withPub("/draft"));
      }
    } catch (error) {
      console.error("Error creating draft copy:", error);
      toast.error(error.message || "Failed to save draft version");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Revert to Draft (show confirmation)
  const handleDraft = async () => {
    setShowDraftConfirmModal(true);
  };

  // Handle Revert from Trash to Draft
  const handleRevertFromTrash = async () => {
    try {
      const result = await saveBlog("draft", null, true);
      if (result) {
        router.replace(withPub("/draft"));
      }
    } catch (error) {
      console.error("Error reverting from trash:", error);
    }
  };

  // Handle Publish
  const handlePublish = async () => {
    const currentEditorContent = getCurrentEditorContent();
    updateEditorContent(currentEditorContent);

    if (
      !isArticlePublishable({
        title: blogTitle,
        description: blogDescription,
        content: currentEditorContent.html,
      })
    ) {
      toast.error(
        "Add title, description, and content before publishing this article.",
      );
      return;
    }

    markPublishing();

    try {
      const result = await saveBlog("published");
      if (result) {
        // Clean up Dexie draft after successful publish
        publishCompletedRef.current = true;
        localDraftWinsRef.current = false;
        setPendingRecoveryDraft(null);
        setShowRecoveryModal(false);
        clearDraft();
        setPublishedBlogSlug(result.slug || "");
        setShowPublishSuccess(true);
      }
    } catch (error) {
      console.error("Publish failed:", error);
    }
  };

  useEffect(() => {
    if (!showPublishSuccess) return;
    router.prefetch(withPub("/published"));
    router.prefetch(withPub("/home"));
  }, [router, showPublishSuccess, withPub]);

  // Handle Send for Review (for editors/authors in joined publications)
  const handleSendForReview = async () => {
    const result = await saveBlog("review", null, true);
    if (result) {
      toast.success("Article submitted for review");
      markNavigating();

      // Determine redirection path based on role
      const role = currentPublication?.role;
      const isOwner = currentPublication?.isOwner;
      const isReviewer = isOwner || role === "editor" || role === "admin";
      const targetPath = isReviewer ? "/review" : "/author-review";

      setTimeout(() => {
        router.replace(withPub(targetPath));
      }, 1000);
    }
  };

  const source = searchParams.get("source");
  const canPublishCurrentArticle = isArticlePublishable({
    title: blogTitle,
    description: blogDescription,
    content: editorContent.html,
  });

  const handleExitNavigation = () => {
    markNavigating();
    if (source) {
      router.replace(withPub(source));
      return;
    }

    if (articleStatus === "published") {
      router.replace(withPub("/published"));
    } else if (articleStatus === "review") {
      const targetPath =
        currentPublication?.isOwner ||
        currentPublication?.role === "editor" ||
        currentPublication?.role === "admin"
          ? "/review"
          : "/author-review";
      router.replace(withPub(targetPath));
    } else if (articleStatus === "trash") {
      router.replace(withPub("/trash"));
    } else {
      router.replace(withPub("/draft"));
    }
  };

  // Helper for consistent save-and-exit behavior
  const performSaveAndExit = async (targetPath, forceExit = false) => {
    const result = await saveBlog("draft", null, true);

    if (result || forceExit) {
      toast.success("Post has been saved as Draft");
      markNavigating();
      setTimeout(() => {
        router.replace(withPub(targetPath));
      }, 1000);
    }
  };

  // Handle Back - Check for unsaved changes and show exit modal if needed
  const handleBack = async () => {
    const currentEditorContent = getCurrentEditorContent();
    const isEmptyDraft =
      !currentBlogId &&
      !blogTitle.trim() &&
      !blogDescription.trim() &&
      (!currentEditorContent.html || currentEditorContent.html === "<p></p>") &&
      (!selectedCategories || selectedCategories.length === 0);

    if (isEmptyDraft) {
      markNavigating();
      router.replace(withPub(source || "/"));
      return;
    }

    // Direct navigation if no unsaved changes
    if (!hasUnsavedChanges || !currentBlogId) {
      markNavigating();
      if (source) {
        router.replace(withPub(source));
        return;
      }

      // Fallback based on status
      if (existingBlogStatus === "published") {
        router.replace(withPub("/published"));
      } else if (existingBlogStatus === "scheduled") {
        router.replace(withPub("/schedule"));
      } else {
        router.replace(withPub("/draft"));
      }
      return;
    }

    // If there are unsaved changes, show exit confirmation modal
    setExitDestination(
      source || (existingBlogStatus === "published" ? "published" : "drafts"),
    );
    setShowExitModal(true);
  };

  const handleDiscard = () => {
    markNavigating();
    clearDraft();
    setShowExitModal(false);

    // Navigate based on destination
    if (exitDestination && exitDestination.startsWith("/")) {
      router.replace(withPub(exitDestination));
    } else if (exitDestination === "published") {
      router.replace(withPub("/published"));
    } else if (exitDestination === "drafts") {
      router.replace(withPub("/draft"));
    } else {
      router.replace(withPub("/"));
    }

    setExitDestination(null);
  };

  const handleUpdateAndExit = async () => {
    setShowExitModal(false);

    // Save first
    // If article is already published, keep it published. Otherwise default to draft.
    const statusToSave =
      existingBlogStatus === "published" ? "published" : "draft";
    const result = await saveBlog(statusToSave, null, true);
    if (!result) {
      // saveBlog already shows an error toast; keep user on editor so they can retry
      return;
    }
    toast.success("Article updated successfully");

    // Navigate based on destination
    if (exitDestination && exitDestination.startsWith("/")) {
      router.replace(withPub(exitDestination));
    } else if (
      exitDestination === "published" ||
      existingBlogStatus === "published"
    ) {
      router.replace(withPub("/published"));
    } else if (exitDestination === "drafts") {
      router.replace(withPub("/draft"));
    } else {
      router.replace(withPub("/"));
    }

    setExitDestination(null);
  };

  // Handle Schedule
  const handleSchedule = async (
    dateOverride = selectedDate,
    timeOverride = selectedTime,
  ) => {
    if (!dateOverride) {
      toast.error("Please select a date");
      return;
    }

    if (!timeOverride) {
      toast.error("Please select a time slot");
      return;
    }

    const [hour, minute] = timeOverride.split(":").map(Number);

    // Create scheduled datetime from selected date and selected slot
    const scheduledDateTime = new Date(dateOverride);
    scheduledDateTime.setHours(hour, minute, 0, 0);

    // Check if scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    try {
      const result = await saveBlog("scheduled", scheduledDateTime, true);
      if (result) {
        setShowCalendar(false);
        toast.success("Article scheduled successfully");
        markNavigating();
        setTimeout(() => {
          router.replace(withPub("/schedule"));
        }, 1000);
      } else {
        toast.error("Failed to schedule article. Please try again.");
      }
    } catch (error) {
      console.error("Schedule error:", error);
      toast.error("Failed to schedule article. Please try again.");
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const handleThumbnailAdd = async (data) => {
    setThumbnailData(data);
    setThumbnailRemoved(false);
    setThumbnailStatus("selected");

    const effectiveId = currentBlogId || shadowIdRef.current;
    const shouldUploadImmediately = Boolean(effectiveId);

    if (!shouldUploadImmediately) {
      return;
    }

    try {
      const uploadedImageUrl = await persistThumbnailForBlog(effectiveId, data, {
        showSuccessToast: true,
        showErrorToast: true,
      });
      if (uploadedImageUrl) {
        syncExtraDirtySignal(`url:${uploadedImageUrl}`);
      }
    } catch {
      // Errors are surfaced by persistThumbnailForBlog.
    }
  };

  const handleThumbnailRemove = () => {
    setThumbnailData(null);
    setThumbnailRemoved(true);
    setThumbnailStatus("removed");
  };

  const thumbnailButtonLabel =
    thumbnailStatus === "uploading"
      ? "Uploading..."
      : thumbnailStatus === "uploaded"
        ? "Thumbnail Saved"
        : thumbnailStatus === "error"
          ? "Upload Failed"
          : thumbnailStatus === "removed"
            ? "Thumbnail Removed"
            : thumbnailData?.file
              ? "Thumbnail Pending"
              : "Thumbnail Image";
  const thumbnailButtonClass =
    thumbnailStatus === "error"
      ? "border-red-300 bg-red-50"
      : thumbnailStatus === "uploading"
        ? "border-blue-300 bg-blue-50"
        : thumbnailStatus === "uploaded"
          ? "border-green-400 bg-green-50"
          : thumbnailStatus === "removed"
            ? "border-amber-300 bg-amber-50"
            : thumbnailData
              ? "border-green-400 bg-green-50"
              : "border-gray-200 bg-white";
  const thumbnailTextClass =
    thumbnailStatus === "error"
      ? "text-red-700"
      : thumbnailStatus === "uploading"
        ? "text-blue-700"
        : thumbnailStatus === "uploaded"
          ? "text-green-700"
          : thumbnailStatus === "removed"
            ? "text-amber-700"
            : thumbnailData
              ? "text-green-700"
              : "";

  const formatDateValue = (date) =>
    `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${date.getFullYear()}`;

  const isSameLocalDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const maskDateInput = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  const applyDatePartBounds = (digits) => {
    let dayPart = digits.slice(0, 2);
    let monthPart = digits.slice(2, 4);
    let yearPart = digits.slice(4, 8);

    if (dayPart.length === 2) {
      let day = Number(dayPart);
      day = Math.min(Math.max(day || 1, 1), 31);
      dayPart = String(day).padStart(2, "0");
    }

    if (monthPart.length === 2) {
      let month = Number(monthPart);
      month = Math.min(Math.max(month || 1, 1), 12);
      monthPart = String(month).padStart(2, "0");
    }

    if (yearPart.length === 4) {
      const minYear = scheduleCurrentYear;
      let year = Number(yearPart);
      if (year < minYear) year = minYear;
      if (year > scheduleYearInputUpperBound) year = scheduleCurrentYear;
      yearPart = String(year).padStart(4, "0");

      if (dayPart.length === 2 && monthPart.length === 2) {
        const month = Number(monthPart);
        const maxDay = new Date(year, month, 0).getDate();
        let day = Number(dayPart);
        day = Math.min(Math.max(day || 1, 1), maxDay);
        dayPart = String(day).padStart(2, "0");
      }
    }

    return `${dayPart}${monthPart}${yearPart}`;
  };

  const maskTimeInput = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const normalizeDateInputValue = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length !== 8) {
      return { complete: false, formatted: maskDateInput(raw), date: null };
    }

    let day = Number(digits.slice(0, 2));
    let month = Number(digits.slice(2, 4));
    let year = Number(digits.slice(4, 8));

    if (year < scheduleCurrentYear) year = scheduleCurrentYear;
    if (year > scheduleYearInputUpperBound) year = scheduleCurrentYear;
    month = Math.min(Math.max(month || 1, 1), 12);
    const maxDay = new Date(year, month, 0).getDate();
    day = Math.min(Math.max(day || 1, 1), maxDay);

    let normalized = new Date(year, month - 1, day);
    normalized.setHours(0, 0, 0, 0);

    if (normalized < scheduleMinDate) {
      normalized = new Date(scheduleMinDate);
    }

    return {
      complete: true,
      formatted: formatDateValue(normalized),
      date: normalized,
    };
  };

  const normalizeTimeInputValue = (raw, referenceDate) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length !== 4) {
      return { complete: false, formatted: maskTimeInput(raw), time: null };
    }

    let hour = Number(digits.slice(0, 2));
    let minute = Number(digits.slice(2, 4));
    hour = Math.min(Math.max(hour, 0), 23);
    minute = Math.min(Math.max(minute, 0), 59);

    const now = new Date();
    if (referenceDate && isSameLocalDate(referenceDate, now)) {
      const candidate = new Date(referenceDate);
      candidate.setHours(hour, minute, 0, 0);
      if (candidate <= now) {
        const next = new Date(now.getTime() + 60_000);
        next.setSeconds(0, 0);
        hour = next.getHours();
        minute = next.getMinutes();
      }
    }

    return {
      complete: true,
      formatted: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  };

  const handleDateInputChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const bounded = applyDatePartBounds(digits);
    const masked = maskDateInput(bounded);
    setDateInput(masked);
    setDateError("");
    setSelectedDate(null);

    if (bounded.length === 8) {
      const normalized = normalizeDateInputValue(masked);
      if (normalized.complete && normalized.date) {
        setSelectedDate(normalized.date);
      }
    }
  };

  const handleDateInputBlur = () => {
    if (!dateInput) {
      setDateError("");
      setSelectedDate(null);
      return;
    }

    const normalized = normalizeDateInputValue(dateInput);
    if (!normalized.complete || !normalized.date) {
      setDateError("Enter date as dd-mm-yyyy");
      setSelectedDate(null);
      return;
    }

    setDateInput(normalized.formatted);
    setSelectedDate(normalized.date);
    setDateError("");

    if (timeInput) {
      const normalizedTime = normalizeTimeInputValue(timeInput, normalized.date);
      if (normalizedTime.complete && normalizedTime.time) {
        setTimeInput(normalizedTime.formatted);
        setSelectedTime(normalizedTime.time);
        setTimeError("");
      }
    }
  };

  const handleTimeInputChange = (e) => {
    const masked = maskTimeInput(e.target.value);
    setTimeInput(masked);
    setTimeError("");
    setSelectedTime(null);
  };

  const handleTimeInputBlur = () => {
    if (!timeInput) {
      setTimeError("");
      setSelectedTime(null);
      return;
    }

    const normalized = normalizeTimeInputValue(timeInput, selectedDate);
    if (!normalized.complete || !normalized.time) {
      setTimeError("Enter time as HH:mm");
      setSelectedTime(null);
      return;
    }

    setTimeInput(normalized.formatted);
    setSelectedTime(normalized.time);
    setTimeError("");
  };

  const toggleSchedulePicker = () => {
    if (isSaving) return;
    setShowCalendar(!showCalendar);
  };

  const handleScheduleAction = () => {
    if (isSaving) return;

    const normalizedDate = normalizeDateInputValue(dateInput);
    if (!normalizedDate.complete || !normalizedDate.date) {
      setDateError("Enter date as dd-mm-yyyy");
      toast.error("Enter a valid future date in dd-mm-yyyy format");
      return;
    }
    setDateInput(normalizedDate.formatted);
    setSelectedDate(normalizedDate.date);
    setDateError("");

    const normalizedTime = normalizeTimeInputValue(
      timeInput,
      normalizedDate.date,
    );
    if (!normalizedTime.complete || !normalizedTime.time) {
      setTimeError("Enter time as HH:mm");
      toast.error("Enter a valid 24-hour time in HH:mm format");
      return;
    }
    setTimeInput(normalizedTime.formatted);
    setSelectedTime(normalizedTime.time);
    setTimeError("");

    handleSchedule(normalizedDate.date, normalizedTime.time);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Consolidated Styles */}
      <EditorPageStyles />

      {/* Fixed Left Vertical Line - Desktop only (1200px+) */}
      <div
        className="hidden xl:block fixed top-0 bottom-0 w-px bg-gray-200 z-[150]"
        style={{ left: "calc(50% - 448px)" }}
      />

      {/* Fixed Back Button - Left of vertical line - Desktop only (1200px+) */}
      <button
        onClick={handleBack}
        className="hidden xl:flex fixed items-center text-gray-500 hover:text-gray-700 transition-colors z-[151]"
        style={{
          left: "calc(50% - 560px)",
          top: "24px",
          width: "83.5px",
          height: "24px",
          padding: "4px 8px",
          gap: "8px",
        }}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Fixed Right Vertical Line - Desktop only (1200px+) */}
      <div
        className="hidden xl:block fixed top-0 bottom-0 w-px bg-gray-200 z-[150]"
        style={{ left: "calc(50% + 468px)" }}
      />

      <div className="w-full min-h-screen bg-white flex justify-center overflow-x-hidden xl:px-0">
        {/* Left Sidebar Area - Desktop only (1200px+) */}
        <div className="hidden xl:block w-[512px] flex-shrink-0" />

        {/* Center Content Area */}
        <div className="w-full xl:w-[916px] flex-shrink-0 md:border-l md:border-r border-gray-200 xl:border-l-0 xl:border-r-0 min-h-screen pb-[150px]">
          {/* Back Button - Tablet/Mobile only (below 1200px) */}
          <div className="xl:hidden w-full border-b border-gray-200">
            {/* Go Back Button and Status Badge Row - Mobile Only */}
            <div
              className="flex md:hidden w-full border-b border-[#EAEAEA] items-center justify-between"
              style={{
                paddingTop: "45px",
                paddingLeft: "25px",
                paddingRight: "25px",
                paddingBottom: "18px",
              }}
            >
              <button
                onClick={handleBack}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                style={{ gap: "8px" }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Go Back</span>
              </button>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-200">
                <div
                  className={`w-2 h-2 rounded-full ${
                    existingBlogStatus === "published"
                      ? "bg-green-500"
                      : existingBlogStatus === "scheduled"
                        ? "bg-blue-400"
                        : existingBlogStatus === "trash"
                          ? "bg-red-500"
                          : "bg-orange-400"
                  }`}
                ></div>
                <span className="text-gray-500 text-sm">
                  {existingBlogStatus === "published"
                    ? "Published"
                    : existingBlogStatus === "scheduled"
                      ? "Scheduled"
                      : existingBlogStatus === "trash"
                        ? "Trash"
                        : existingBlogStatus === "review"
                          ? "In Review"
                          : "Drafts"}
                </span>
              </div>
            </div>

            {/* Go Back Button - Tablet Only */}
            {/* Go Back Button - Tablet Only */}
            <div className="hidden md:flex xl:hidden w-full border-b border-[#EAEAEA]">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                style={{
                  gap: "8px",
                  paddingTop: "45px",
                  paddingLeft: "25px",
                  paddingBottom: "18px",
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Go Back</span>
              </button>
            </div>
          </div>

          {/* Header Section */}
          <div
            className="flex flex-col w-full gap-2.5 px-8 xl:pr-8 xl:pl-8 border-b border-gray-200"
            style={{ paddingTop: "24px", paddingBottom: "24px" }}
          >
            {/* Title Block */}
            <div className="flex flex-col w-full">
              {/* Status Badge - Desktop and Tablet Only */}
              <div className="hidden md:inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-200 w-fit mb-4">
                <div
                  className={`w-2 h-2 rounded-full ${
                    existingBlogStatus === "published"
                      ? "bg-green-500"
                      : existingBlogStatus === "scheduled"
                        ? "bg-blue-400"
                        : existingBlogStatus === "trash"
                          ? "bg-red-500"
                          : "bg-orange-400"
                  }`}
                ></div>
                <span className="text-gray-500 text-sm">
                  {existingBlogStatus === "published"
                    ? "Published"
                    : existingBlogStatus === "scheduled"
                      ? "Scheduled"
                      : existingBlogStatus === "trash"
                        ? "Trash"
                        : existingBlogStatus === "review"
                          ? "In Review"
                          : "Drafts"}
                </span>
              </div>

              {/* Title and Description with 8px gap */}
              <div className="flex flex-col gap-2">
                {/* Title Input */}
                <input
                  type="text"
                  placeholder="Title of the Blog..."
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="title-input w-full text-3xl font-semibold bg-transparent focus:outline-none border-0 p-0"
                />

                {/* Description Input */}
                <input
                  type="text"
                  placeholder="Write your Short Description for your Blog..."
                  value={blogDescription}
                  onChange={(e) => setBlogDescription(e.target.value)}
                  className="desc-input w-full text-sm text-gray-500 bg-transparent focus:outline-none border-0 p-0"
                />
              </div>
            </div>
          </div>

          {/* Category/Toolbar Section */}
          <div
            className="flex flex-col w-full bg-[#FEFEFE] border-b border-gray-200"
            style={{
              paddingTop: "16px",
              paddingBottom: "16px",
              paddingLeft: "32px",
              paddingRight: "12px",
            }}
          >
            {/* Category and Thumbnail Row */}
            <div className="flex items-center gap-2">
              <EditorCategoryDropdown
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                buttonText="Category"
              />

              <button
                className={`relative flex items-center w-[180px] h-8 gap-2 rounded border ${thumbnailButtonClass} text-sm px-4 py-2 hover:bg-gray-50 transition-colors whitespace-nowrap`}
                onClick={() => setShowThumbnailModal(true)}
              >
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${thumbnailTextClass}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className={thumbnailTextClass}>
                  {thumbnailButtonLabel}
                </span>
                {thumbnailStatus === "uploading" ? (
                  <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                ) : thumbnailStatus === "error" ? (
                  <span className="ml-auto text-sm font-semibold text-red-600">
                    !
                  </span>
                ) : thumbnailData && (
                  <svg
                    className="w-4 h-4 text-green-600 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0"></div>

              {/* Save Status - Desktop and Tablet Only */}
              <SaveStatusIndicator
                saveStatus={saveStatus}
                isAutoSaving={isAutoSaving}
                hasContent={hasContent}
              />
            </div>
          </div>

          {/* Editor Content Area */}
          <div
            className="w-full bg-white"
            style={{ minHeight: "400px", paddingBottom: "10px" }}
          >
            {isLoading ? (
              <EditorContentSkeleton />
            ) : (
              <TiptapEditor
                key={editorRenderKey}
                onUpdate={handleEditorUpdate}
                initialContent={initialContent}
                editorRef={editorInstanceRef}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar Area - Desktop only (1200px+) */}
        <div className="hidden xl:block w-[490px] flex-shrink-0" />
      </div>

      <EditorStatsBar
        charCount={editorContent.charCount}
        wordCount={editorContent.wordCount}
      />

      <EditorFooterActions
        existingBlogStatus={existingBlogStatus}
        isSaving={isSaving}
        canPublishCurrentArticle={canPublishCurrentArticle}
        publicationId={publicationId}
        currentPublication={currentPublication}
        dateError={dateError}
        timeError={timeError}
        dateInput={dateInput}
        timeInput={timeInput}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        handleSave={handleSave}
        handleDraft={handleDraft}
        handleRevertFromTrash={handleRevertFromTrash}
        handlePublish={handlePublish}
        handleSendForReview={handleSendForReview}
        handleDateInputChange={handleDateInputChange}
        handleDateInputBlur={handleDateInputBlur}
        handleTimeInputChange={handleTimeInputChange}
        handleTimeInputBlur={handleTimeInputBlur}
        toggleSchedulePicker={toggleSchedulePicker}
        handleScheduleAction={handleScheduleAction}
      />

      {/* Calendar Popup */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className="fixed z-[1001] bg-white rounded"
          style={{
            bottom: "88px",
            left: "50%",
            transform: "translateX(-50%)",
            border: "0.75px solid #B0B0B0",
            boxShadow: "8px 4px 30px 0px rgba(0,0,0,0.15)",
            padding: "16px",
          }}
        >
          <div className="w-[20rem] sm:w-[24rem]">
            <Calendar10
              date={selectedDate}
              time={selectedTime}
              minDate={scheduleMinDate}
              onDateChange={(date) => {
                const normalizedDate = new Date(date);
                normalizedDate.setHours(0, 0, 0, 0);
                setSelectedDate(normalizedDate);
                setDateError("");
                setDateInput(
                  `${String(normalizedDate.getDate()).padStart(2, "0")}-${String(
                    normalizedDate.getMonth() + 1,
                  ).padStart(2, "0")}-${normalizedDate.getFullYear()}`,
                );
              }}
              onTimeChange={(time) => {
                setSelectedTime(time);
                setTimeInput(time || "");
                setTimeError("");
              }}
            />

            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setDateInput("");
                  setTimeInput("");
                  setDateError("");
                  setTimeError("");
                }}
                size="sm"
                variant="outline"
              >
                Clear
              </Button>
              <Button onClick={() => setShowCalendar(false)} size="sm" disabled={isSaving}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Modal */}
      <ThumbnailModal
        isOpen={showThumbnailModal}
        onClose={() => setShowThumbnailModal(false)}
        onImageAdd={handleThumbnailAdd}
        onImageRemove={handleThumbnailRemove}
        initialPreviewUrl={
          thumbnailData?.previewUrl || thumbnailData?.url || null
        }
      />

      {/* Publish Success Modal */}
      {showPublishSuccess && (
        <PublishSuccessModal
          isOpen={showPublishSuccess}
          onClose={handleClosePublishModal}
          onSeeLater={handleSeeLater}
          onViewInSite={handleViewInSite}
        />
      )}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => {
          setShowExitModal(false);
          setExitDestination(null);
        }}
        onDiscard={handleDiscard}
        onUpdate={handleUpdateAndExit}
      />

      <ConfirmModal
        isOpen={showDraftConfirmModal}
        onClose={() => setShowDraftConfirmModal(false)}
        onConfirm={executeDraft}
        title="Create a Draft?"
        message="A draft copy will be created with your current changes. The original article will remain published."
        confirmText="Create Draft"
        confirmStyle="normal"
      />

      <ConfirmModal
        isOpen={showRecoveryModal}
        onClose={handleDiscardRecoveryDraft}
        onConfirm={handleRestoreRecoveryDraft}
        title="Unsaved local changes found"
        message="A newer local draft is available from this browser. Restore it to continue from your latest unsaved work, or discard it to keep the server version."
        cancelText="Discard"
        confirmText="Restore"
        confirmStyle="normal"
      />
    </div>
  );
}
