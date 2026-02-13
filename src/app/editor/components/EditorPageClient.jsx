"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditorCategoryDropdown from "./EditorCategoryDropdown";
import { ThumbnailModal } from "./ThumbnailModal";
import { DateTimePicker } from "./DateTimePicker";
import PublishSuccessModal from "./PublishSuccessModal";
import ExitConfirmModal from "./ExitConfirmModal";
import { useArticles } from "@/contexts/ArticlesContext";
import { useSession } from "@/lib/auth-client";
import { usePublication } from "@/contexts/PublicationContext";
import { useToast } from "@/contexts/ToastContext";

import {
  Image as ImageIcon,
  Calendar,
  ChevronLeft,
  FileText,
} from "lucide-react";

import { TiptapEditor } from "./TiptapEditor";
import { getApiBase } from "@/utils/apiBase";

const API_URL = getApiBase();

export default function EditorPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const {
    createArticle,
    updateArticle,
    uploadArticleImage,
    getArticleById,
    loadUserArticles,
  } = useArticles();
  const { currentPublication } = usePublication();
  const { showToast } = useToast();
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

  useEffect(() => {
    if (blogId && blogId !== currentBlogId) {
      setCurrentBlogId(blogId);
    }
  }, [blogId, currentBlogId]);

  // Determine if user is owner or member
  const isPublicationOwner = currentPublication?.isOwner ?? true; // Default to true if no publication context

  // Debug log
  useEffect(() => {
    console.log("Editor - publicationId:", publicationId);
    console.log("Editor - articleStatus:", articleStatus);
    console.log("Editor - isPublicationOwner:", isPublicationOwner);
    console.log("Editor - currentPublication:", currentPublication);
  }, [publicationId, articleStatus, isPublicationOwner, currentPublication]);

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
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [editorContent, setEditorContent] = useState({
    charCount: 0,
    wordCount: 0,
    html: "",
    text: "",
  });
  const [blogTitle, setBlogTitle] = useState("");
  const [blogDescription, setBlogDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const [publishedBlogSlug, setPublishedBlogSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialContent, setInitialContent] = useState("");
  const [initialTitle, setInitialTitle] = useState("");
  const [initialDescription, setInitialDescription] = useState("");
  const [initialCategories, setInitialCategories] = useState([]);
  const [existingBlogStatus, setExistingBlogStatus] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const calendarRef = useRef(null);
  const savedSuccessfullyRef = useRef(false);
  const handlingPopStateRef = useRef(false);

  // Auto-save functionality with debouncing
  useEffect(() => {
    // Check if there's any content
    const contentExists =
      blogTitle.trim() ||
      blogDescription.trim() ||
      (editorContent.html && editorContent.html !== "<p></p>");
    setHasContent(contentExists);

    // Don't auto-save if no title (minimum requirement for draft)
    if (!blogTitle.trim()) {
      setSaveStatus("idle");
      return;
    }

    // Don't auto-save if there are no unsaved changes
    if (!hasUnsavedChanges) {
      return;
    }

    // IMPORTANT: Only auto-save for drafts or new articles
    // Don't auto-save published, scheduled, or review articles
    const isPublishedOrScheduled =
      existingBlogStatus &&
      ["published", "scheduled", "review", "unpublished"].includes(
        existingBlogStatus,
      );

    if (isPublishedOrScheduled) {
      // For published/scheduled articles, don't auto-save
      setSaveStatus("idle");
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set saving status immediately
    setSaveStatus("saving");

    // Debounce auto-save by 1.5 seconds
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Only auto-save drafts or new blogs (not published/scheduled/review)
      const canAutoSave = !existingBlogStatus || existingBlogStatus === "draft";

      if (canAutoSave && blogTitle.trim()) {
        const result = await saveBlog("draft", null, true, true);
        if (result) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("idle");
        }
      }
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    blogTitle,
    blogDescription,
    editorContent.html,
    selectedCategories,
    hasUnsavedChanges,
    existingBlogStatus,
  ]);

  // Track unsaved changes
  // Track unsaved changes by comparing with initial values
  useEffect(() => {
    // Helper to compare arrays (categories)
    const arraysEqual = (a, b) => {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      for (let i = 0; i < sortedA.length; ++i) {
        if (sortedA[i] !== sortedB[i]) return false;
      }
      return true;
    };

    // Helper to normalize HTML content
    const normalizeContent = (content) => {
      if (!content) return "";
      if (content === "<p></p>") return ""; // Treat empty paragraph as empty
      return content;
    };

    const hasChanges =
      blogTitle !== initialTitle ||
      blogDescription !== initialDescription ||
      normalizeContent(editorContent.html) !==
        normalizeContent(initialContent) ||
      !arraysEqual(selectedCategories, initialCategories);

    setHasUnsavedChanges(hasChanges);
  }, [
    blogTitle,
    blogDescription,
    editorContent.html,
    selectedCategories,
    initialTitle,
    initialDescription,
    initialContent,
    initialCategories,
  ]);

  // Auto-save when leaving the page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Auto-save if there are unsaved changes and title exists (minimum requirement)
      const hasTitle = blogTitle.trim();

      if (hasUnsavedChanges && hasTitle && !savedSuccessfullyRef.current) {
        // IMPORTANT: Only auto-save as draft for new articles or existing drafts
        // Don't create drafts for published/scheduled/review articles
        const isPublishedOrScheduled =
          existingBlogStatus &&
          ["published", "scheduled", "review", "unpublished"].includes(
            existingBlogStatus,
          );

        if (isPublishedOrScheduled) {
          // For published/scheduled articles, show warning but don't auto-save
          e.preventDefault();
          e.returnValue =
            "You have unsaved changes. Are you sure you want to leave?";
          return e.returnValue;
        }

        // For new articles or drafts, auto-save silently
        // Use sendBeacon for reliable save on page unload
        const blogData = {
          title: blogTitle,
          description: blogDescription,
          content: editorContent.html,
          categories: selectedCategories,
          status: "draft",
          published: false,
        };

        const pubId = publicationId || currentPublication?.id;
        if (pubId) {
          blogData.publicationId = parseInt(pubId);
        }

        const url = currentBlogId
          ? `${API_URL}/api/blogs/${currentBlogId}`
          : `${API_URL}/api/blogs`;

        // Use sendBeacon for reliable save during page unload
        const blob = new Blob([JSON.stringify(blogData)], {
          type: "application/json",
        });
        navigator.sendBeacon(url, blob);

        // Also try fetch with keepalive as backup
        fetch(url, {
          method: currentBlogId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(blogData),
          keepalive: true, // Ensures request completes even if page is closed
        }).catch(() => {
          // Silently fail - sendBeacon should handle it
        });
      }
    };

    // Handle visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const hasTitle = blogTitle.trim();

        if (hasUnsavedChanges && hasTitle && !savedSuccessfullyRef.current) {
          // Only auto-save as draft for new articles or existing drafts
          const isPublishedOrScheduled =
            existingBlogStatus &&
            ["published", "scheduled", "review", "unpublished"].includes(
              existingBlogStatus,
            );

          if (!isPublishedOrScheduled) {
            // Save as draft when user switches tabs or minimizes
            await saveBlog("draft", null, true, true);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    hasUnsavedChanges,
    currentBlogId,
    blogTitle,
    blogDescription,
    editorContent.html,
    selectedCategories,
    existingBlogStatus,
    publicationId,
    currentPublication,
  ]);

  // Load existing blog if editing
  useEffect(() => {
    if (blogId) {
      loadExistingBlog(blogId);
    }
  }, [blogId]);

  const loadExistingBlog = async (id) => {
    setIsLoading(true);
    try {
      console.log(`Loading blog with ID: ${id}`);
      const response = await fetch(`${API_URL}/api/blogs/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to load blog: ${response.status} ${response.statusText}`,
          errorText,
        );
        throw new Error(
          `Failed to load blog: ${response.status} ${errorText || response.statusText}`,
        );
      }

      const blog = await response.json();
      console.log("Loaded blog for editing:", blog);

      setBlogTitle(blog.title || "");
      setInitialTitle(blog.title || "");

      setBlogDescription(blog.description || "");
      setInitialDescription(blog.description || "");

      setSelectedCategories(blog.categories || []);
      setInitialCategories(blog.categories || []);

      setInitialContent(blog.content || "");

      // Initialize editorContent state to prevent data loss if saving without editing body
      setEditorContent({
        html: blog.content || "",
        text: "", // Initial text representation (will be updated by editor on load)
        charCount: (blog.content || "").length,
        wordCount: 0,
      });

      setExistingBlogStatus(blog.status);

      if (blog.image) {
        setThumbnailData({ url: blog.image });
        setThumbnailRemoved(false);
      }

      if (blog.scheduledAt) {
        const scheduledDate = new Date(blog.scheduledAt);
        setSelectedDate(scheduledDate);
        setSelectedHour(scheduledDate.getHours());
        setSelectedMinute(scheduledDate.getMinutes());
      }
    } catch (error) {
      console.error("Error loading blog:", error);
      // alert(`Failed to load blog: ${error.message}`)
    } finally {
      setIsLoading(false);
    }
  };

  // Save blog to database (create new or update existing)
  const saveBlog = async (
    status,
    scheduledAt = null,
    skipValidation = false,
    isAutoSave = false,
  ) => {
    // Skip validation when reverting to draft or updating existing published articles
    // Also skip validation if blog already exists (updating)
    if (!skipValidation && !currentBlogId) {
      if (!blogTitle.trim()) {
        console.warn("Validation failed: Missing title");
        return false;
      }
      if (!blogDescription.trim()) {
        console.warn("Validation failed: Missing description");
        return false;
      }
    }

    setIsSaving(true);
    // Only set saving status for manual saves, not auto-saves
    if (!isAutoSave) {
      setSaveStatus("saving");
    }
    try {
      const blogData = {
        title: blogTitle,
        description: blogDescription,
        content: editorContent.html,
        categories: selectedCategories,
        status: status,
        published: status === "published",
      };

      // Add publicationId if available
      const pubId = publicationId || currentPublication?.id;
      if (pubId) {
        blogData.publicationId = parseInt(pubId);
        console.log("Blog will be assigned to publication:", pubId);
      } else {
        console.warn(
          "No publication ID available - blog may not be assigned to correct publication",
        );
        console.warn("publicationId from URL:", publicationId);
        console.warn("currentPublication:", currentPublication);
      }

      // Add scheduledAt if scheduling
      if (scheduledAt) {
        blogData.scheduledAt = scheduledAt.toISOString();
      }

      if (thumbnailRemoved) {
        blogData.image = null;
      }

      console.log("Saving blog with data:", blogData, "blogId:", currentBlogId);

      // Use PUT for updates, POST for new blogs
      const url = currentBlogId
        ? `${API_URL}/api/blogs/${currentBlogId}`
        : `${API_URL}/api/blogs`;
      const method = currentBlogId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(blogData),
      });

      console.log("Response status:", response.status);

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save blog");
      }

      if (!currentBlogId && responseData?.id) {
        setCurrentBlogId(String(responseData.id));
        const params = new URLSearchParams(searchParams.toString());
        params.set("id", String(responseData.id));
        if (!params.get("status")) {
          params.set("status", status);
        }
        if (publicationId) {
          params.set("publicationId", publicationId);
        }
        router.replace(withPub(`/editor?${params.toString()}`), {
          scroll: false,
        });
      }

      // Upload thumbnail if one was selected
      if (thumbnailData && thumbnailData.file) {
        try {
          console.log("Uploading thumbnail for blog:", responseData.id);
          await uploadArticleImage(responseData.id, thumbnailData.file);
          console.log("Thumbnail uploaded successfully");
        } catch (error) {
          console.error("Error uploading thumbnail:", error);
          // Don't fail the whole save if thumbnail upload fails
        }
      }

      // Mark as saved to prevent auto-save on exit
      setHasUnsavedChanges(false);
      savedSuccessfullyRef.current = true;
      if (!isAutoSave) {
        setSaveStatus("saved");
      }

      return responseData;
    } catch (error) {
      console.error("Error saving blog:", error);
      if (!isAutoSave) {
        setSaveStatus("idle");
      }
      // alert(error.message || 'Failed to save blog')
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save to Draft (without redirect - just save and stay on page)
  const handleSave = async () => {
    const result = await saveBlog(existingBlogStatus || "draft", null, true);
    if (result && existingBlogStatus === "published") {
      // For published articles, redirect to published page
      window.location.href = withPub("/published?refresh=true");
    }
  };

  // Handle Save to Draft (with redirect)
  const handleSaveDraft = async () => {
    await performSaveAndExit("/draft?refresh=true", false);
  };

  // Handle Revert to Draft (for published articles)
  const handleDraft = async () => {
    const result = await saveBlog("draft", null, true);
    if (result) {
      window.location.href = withPub("/draft?refresh=true");
    }
  };

  // Handle Revert from Trash to Draft
  const handleRevertFromTrash = async () => {
    try {
      const result = await saveBlog("draft", null, true);
      if (result) {
        window.location.href = withPub("/draft?refresh=true");
      }
    } catch (error) {
      console.error("Error reverting from trash:", error);
    }
  };

  // Handle Publish
  const handlePublish = async () => {
    const result = await saveBlog("published");
    if (result) {
      setPublishedBlogSlug(result.slug || "");
      setShowPublishSuccess(true);
    }
  };

  // Handle Send for Review (for editors/authors in joined publications)
  const handleSendForReview = async () => {
    const result = await saveBlog("review", null, true);
    if (result) {
      console.log("Article sent for review!");

      // Determine redirection path based on role
      const role = currentPublication?.role;
      const isOwner = currentPublication?.isOwner;
      const isReviewer = isOwner || role === "editor" || role === "admin";
      const targetPath = isReviewer ? "/review" : "/author-review";

      window.location.href = withPub(`${targetPath}?refresh=true`);
    }
  };

  const handleExitNavigation = () => {
    savedSuccessfullyRef.current = true; // Prevent beforeunload check
    if (articleStatus === "published") {
      router.push(withPub("/published?refresh=true"));
    } else if (articleStatus === "review") {
      const targetPath =
        currentPublication?.isOwner ||
        currentPublication?.role === "editor" ||
        currentPublication?.role === "admin"
          ? "/review"
          : "/author-review";
      router.push(withPub(`${targetPath}?refresh=true`));
    } else if (articleStatus === "trash") {
      router.push(withPub("/trash?refresh=true"));
    } else {
      router.push(withPub("/draft?refresh=true"));
    }
  };

  // Helper for consistent save-and-exit behavior
  const performSaveAndExit = async (targetPath, forceExit = false) => {
    const result = await saveBlog("draft", null, true);

    // Show toast if save succeeded OR if we are forced to exit (user expectation)
    if (result || forceExit) {
      showToast("Post has been saved as Draft", "success");
      savedSuccessfullyRef.current = true;
      setTimeout(() => {
        router.push(withPub(targetPath));
      }, 1000);
    }
  };

  // Handle Back - Check for unsaved changes
  // Handle Back - Save as draft and redirect to home
  const handleBack = async () => {
    const isEmptyDraft =
      !currentBlogId &&
      !blogTitle.trim() &&
      !blogDescription.trim() &&
      (!editorContent.html || editorContent.html === "<p></p>") &&
      (!selectedCategories || selectedCategories.length === 0);

    if (isEmptyDraft) {
      savedSuccessfullyRef.current = true;
      router.push(withPub("/?refresh=true"));
      return;
    }

    // For any content: save as draft and go to Drafts
    if (hasUnsavedChanges) {
      await performSaveAndExit("/draft?refresh=true", true);
      return;
    }

    // No unsaved changes but has content: go to drafts directly
    savedSuccessfullyRef.current = true;
    router.push(withPub("/draft?refresh=true"));
  };

  // Intercept browser back/gesture to auto-save draft and navigate home
  useEffect(() => {
    if (!isMounted) return;

    const pushCurrentState = () => {
      try {
        window.history.pushState({ editor: true }, "", window.location.href);
      } catch {
        // Ignore history errors
      }
    };

    const handlePopState = () => {
      if (handlingPopStateRef.current) return;
      handlingPopStateRef.current = true;
      pushCurrentState();
      handleBack().finally(() => {
        handlingPopStateRef.current = false;
      });
    };

    pushCurrentState();
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isMounted, handleBack]);

  const handleDiscard = () => {
    setHasUnsavedChanges(false);
    setShowExitModal(false);
    savedSuccessfullyRef.current = true;
    router.push(withPub("/?refresh=true"));
  };

  const handleUpdateAndExit = async () => {
    // Save as draft and redirect to home page
    setShowExitModal(false);
    await performSaveAndExit("/?refresh=true", false);
  };

  // Handle Schedule
  const handleSchedule = async () => {
    if (!selectedDate) {
      console.warn("Validation failed: Missing scheduled date");
      return;
    }

    // Create scheduled datetime from selected date and time
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(selectedHour, selectedMinute, 0, 0);

    // Check if scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      console.warn("Validation failed: Scheduled time must be in future");
      return;
    }

    const result = await saveBlog("scheduled", scheduledDateTime);
    if (result) {
      setShowCalendar(false);
      window.location.href = withPub("/schedule?refresh=true");
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

  // Calendar helper functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    setManualDate(`${dayStr}-${monthStr}-${currentYear}`);
    const hourStr = String(selectedHour).padStart(2, "0");
    const minuteStr = String(selectedMinute).padStart(2, "0");
    setManualTime(`${hourStr}:${minuteStr}`);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setSelectedHour(10);
    setSelectedMinute(30);
    setManualDate("");
    setManualTime("");
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    const dayStr = String(today.getDate()).padStart(2, "0");
    const monthStr = String(today.getMonth() + 1).padStart(2, "0");
    setManualDate(`${dayStr}-${monthStr}-${today.getFullYear()}`);
    const hourStr = String(selectedHour).padStart(2, "0");
    const minuteStr = String(selectedMinute).padStart(2, "0");
    setManualTime(`${hourStr}:${minuteStr}`);
  };

  const formatSelectedDateTime = () => {
    if (!selectedDate) return "";
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const year = selectedDate.getFullYear();
    const hour = String(selectedHour).padStart(2, "0");
    const minute = String(selectedMinute).padStart(2, "0");
    return `${day}-${month}-${year}   ${hour}:${minute}`;
  };

  const handleManualInput = (e) => {
    let value = e.target.value;

    // Only allow numbers and dashes
    value = value.replace(/[^0-9\-]/g, "");

    // Remove all formatting to get just numbers
    const numbersOnly = value.replace(/[^0-9]/g, "");

    // If input is empty, clear the selected date
    if (numbersOnly === "") {
      setManualDate("");
      setSelectedDate(null);
      return;
    }

    // Auto-format as user types: dd-mm-yyyy
    let formatted = "";
    for (let i = 0; i < numbersOnly.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        formatted += "-";
      }
      formatted += numbersOnly[i];
    }

    setManualDate(formatted);

    // Validate and set date when complete (8 digits: ddmmyyyy)
    if (numbersOnly.length === 8) {
      const day = parseInt(numbersOnly.substring(0, 2));
      const month = parseInt(numbersOnly.substring(2, 4));
      const year = parseInt(numbersOnly.substring(4, 8));

      // Validate ranges
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024) {
        const parsedDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (parsedDate >= today) {
          setSelectedDate(parsedDate);
          setCurrentMonth(parsedDate.getMonth());
          setCurrentYear(parsedDate.getFullYear());
        }
      }
    }
  };

  const handleTimeInput = (e) => {
    let value = e.target.value;

    // Only allow numbers and colons
    value = value.replace(/[^0-9:]/g, "");

    // Remove all formatting to get just numbers
    const numbersOnly = value.replace(/[^0-9]/g, "");

    // If input is empty, reset time
    if (numbersOnly === "") {
      setManualTime("");
      return;
    }

    // Auto-format as user types: hh:mm
    let formatted = "";
    for (let i = 0; i < numbersOnly.length && i < 4; i++) {
      if (i === 2) {
        formatted += ":";
      }
      formatted += numbersOnly[i];
    }

    setManualTime(formatted);

    // Validate and set time when complete (4 digits: hhmm)
    if (numbersOnly.length === 4) {
      const hour = parseInt(numbersOnly.substring(0, 2));
      const minute = parseInt(numbersOnly.substring(2, 4));

      // Validate ranges
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        setSelectedHour(hour);
        setSelectedMinute(minute);
      }
    }
  };

  const getDisplayDate = () => {
    if (manualDate) return manualDate;
    if (!selectedDate) return "";
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const year = selectedDate.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getDisplayTime = () => {
    if (manualTime) return manualTime;
    return "";
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Day labels
    dayLabels.forEach((label, i) => {
      days.push(
        <div
          key={`label-${i}`}
          className="w-6 h-6 flex items-center justify-center text-xs text-gray-500 font-medium"
        >
          {label}
        </div>,
      );
    });

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 h-6" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(currentYear, currentMonth, day);
      dateToCheck.setHours(0, 0, 0, 0);
      const isPast = dateToCheck < today;

      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear;

      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateSelect(day)}
          disabled={isPast}
          className={`w-6 h-6 flex items-center justify-center text-xs rounded-full transition-colors
            ${isPast ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-purple-100"}`}
          style={
            isSelected ? { backgroundColor: "#4B6CFB", color: "white" } : {}
          }
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  const handleThumbnailAdd = (data) => {
    setThumbnailData(data);
    setThumbnailRemoved(false);
    console.log("Thumbnail added:", data);
  };

  const handleThumbnailRemove = () => {
    setThumbnailData(null);
    setThumbnailRemoved(true);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Consolidated Styles */}
      <style jsx>{`
        input.title-input::placeholder,
        input.desc-input::placeholder {
          color: #d2d2d2;
        }

        input.date-time-input::placeholder {
          color: #2e2e2e;
        }

        .saving-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #8aa4ff4d;
          border-top: 2px solid #2659bc;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .stats-bar-container {
          position: fixed;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 39px;
          z-index: 100;
          bottom: 72px;
          left: 0;
          right: 0;
          border-top: 1px solid #eaeaea;
          background: #ffffff;
        }

        @media (min-width: 1280px) {
          .stats-bar-container {
            left: calc(50% - 448px);
            right: auto;
            width: 916px;
          }
        }

        @media (max-width: 767px) {
          .mobile-publish-btn {
            min-width: 74px;
            padding: 8px 16px;
            font-size: 12px;
            line-height: 150%;
          }

          .mobile-schedule-container {
            min-width: 212px;
            max-width: 212px;
            flex-shrink: 0;
          }

          .mobile-date-input {
            font-size: 12px;
            line-height: 150%;
          }

          .mobile-date-input:first-of-type {
            width: 80px;
          }

          .mobile-date-input:nth-of-type(2) {
            width: 35px;
            margin-left: 4px;
          }

          .mobile-schedule-container svg {
            margin-left: 4px;
            margin-right: 4px;
          }

          .mobile-schedule-btn {
            min-width: 69px;
            max-width: 69px;
            padding: 8px 5px;
            font-size: 12px;
            line-height: 150%;
          }

          .mobile-footer-buttons {
            gap: 8px;
            flex-wrap: nowrap;
          }
        }
      `}</style>

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
                className={`relative flex items-center w-[180px] h-8 gap-2 rounded border ${thumbnailData ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"} text-sm px-4 py-2 hover:bg-gray-50 transition-colors whitespace-nowrap`}
                onClick={() => setShowThumbnailModal(true)}
              >
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${thumbnailData ? "text-green-600" : ""}`}
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
                <span className={thumbnailData ? "text-green-700" : ""}>
                  Thumbnail Image
                </span>
                {thumbnailData && (
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
              {hasContent && saveStatus !== "idle" && (
                <div
                  className="hidden md:flex items-center flex-shrink-0"
                  style={{
                    width: saveStatus === "saving" ? "98px" : "78px",
                    height: "33px",
                    borderRadius: "4px",
                    border: "1px solid #EAEAEA",
                    padding: "6px 8px",
                    gap: "8px",
                    transition: "width 0.2s ease",
                  }}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <div className="saving-spinner" />
                      <span
                        style={{
                          width: "56px",
                          height: "21px",
                          fontFamily: "Public Sans",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "150%",
                          letterSpacing: "0%",
                          color: "#696969",
                        }}
                      >
                        Saving...
                      </span>
                    </>
                  ) : (
                    <>
                      <img
                        src="/images/icons/tick4.svg"
                        alt="saved"
                        style={{ width: "13px", height: "13px" }}
                      />
                      <span
                        style={{
                          fontFamily: "Public Sans",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "150%",
                          letterSpacing: "0%",
                          color: "#696969",
                        }}
                      >
                        Saved
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Editor Content Area */}
          <div
            className="w-full bg-white"
            style={{ minHeight: "400px", paddingBottom: "10px" }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <span className="text-gray-500">Loading blog content...</span>
              </div>
            ) : (
              <TiptapEditor
                key={currentBlogId || "new"}
                onUpdate={(data) => setEditorContent(data)}
                initialContent={initialContent}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar Area - Desktop only (1200px+) */}
        <div className="hidden xl:block w-[490px] flex-shrink-0" />
      </div>

      {/* Bottom Stats Bar */}
      <div className="stats-bar-container">
        <div
          className="flex items-center h-full"
          style={{
            gap: "14px",
            padding: "9px 14px",
            background: "#F8F8F8",
            border: "1px solid #F3F3F3",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "Public Sans",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "150%",
              letterSpacing: "0%",
              whiteSpace: "nowrap",
            }}
          >
            <span>Chars</span>
            <strong
              style={{
                fontFamily: "Public Sans",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              {editorContent.charCount}
            </strong>
          </div>
          <div
            style={{ width: "1px", height: "21px", background: "#C0C0C0" }}
          ></div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "Public Sans",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "150%",
              letterSpacing: "0%",
              whiteSpace: "nowrap",
            }}
          >
            <span>Words</span>
            <strong
              style={{
                fontFamily: "Public Sans",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              {editorContent.wordCount}
            </strong>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 w-full h-[72px] flex items-center justify-center bg-white rounded-lg pt-4 pr-4 pb-6 pl-4 shadow-lg z-[100]">
        <div className="mobile-footer-buttons flex items-center justify-center md:gap-4 h-8 flex-wrap max-w-full">
          {/* Show different buttons based on article status */}
          {existingBlogStatus === "published" ? (
            <>
              <button
                className="flex items-center justify-center gap-2 h-8 rounded px-6 py-2 transition-colors disabled:opacity-50"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  width: "160px",
                  height: "32px",
                  borderRadius: "4px",
                  padding: "8px 24px",
                  background: "#080808",
                  fontFamily: "Public Sans",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "150%",
                  letterSpacing: "0%",
                  color: "#EDEDED",
                }}
              >
                {isSaving ? "Updating..." : "Update"}
              </button>

              <button
                className="flex items-center justify-center rounded transition-colors disabled:opacity-50"
                onClick={handleDraft}
                disabled={isSaving}
                style={{
                  width: "160px",
                  height: "32px",
                  borderRadius: "4px",
                  border: "1px solid #F3F3F3",
                  padding: "8px 24px",
                  gap: "4px",
                  background: "#F8F8F8",
                  fontFamily: "Public Sans",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "150%",
                  letterSpacing: "0%",
                  color: "#2E2E2E",
                }}
              >
                <img
                  src="/images/icons/draft.svg"
                  alt="Revert to draft"
                  className="w-5 h-5"
                  style={{ filter: "brightness(0) saturate(100%)" }}
                />
                <span className="whitespace-nowrap">Revert to Draft</span>
              </button>
            </>
          ) : existingBlogStatus === "trash" ? (
            <>
              <button
                className="flex items-center justify-center gap-2 h-8 rounded px-6 py-2 transition-colors disabled:opacity-50"
                onClick={handleRevertFromTrash}
                disabled={isSaving}
                style={{
                  width: "160px",
                  height: "32px",
                  borderRadius: "4px",
                  padding: "8px 24px",
                  background: "#080808",
                  fontFamily: "Public Sans",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "150%",
                  letterSpacing: "0%",
                  color: "#EDEDED",
                }}
              >
                {isSaving ? "Reverting..." : "Revert to Draft"}
              </button>
            </>
          ) : existingBlogStatus === "scheduled" ? (
            <>
              <button
                className="flex items-center justify-center gap-2 h-8 rounded bg-gray-900 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                style={{
                  minWidth: "74px",
                  width: "auto",
                  padding: "0 1rem",
                }}
                onClick={handlePublish}
                disabled={isSaving}
              >
                {isSaving ? "Publishing..." : "Publish Now"}
                <img
                  src="/images/icons/Publish.svg"
                  alt="Publish"
                  className="w-4 h-4 brightness-0 invert"
                />
              </button>

              <div
                className="flex items-center h-8 border border-gray-200 rounded overflow-hidden"
                style={{
                  minWidth: "180px",
                  width: "auto",
                  maxWidth: "100%",
                }}
              >
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={getDisplayDate()}
                  onChange={handleManualInput}
                  maxLength={10}
                  className="date-time-input h-[21px] w-[95px] flex-shrink-0 text-sm bg-transparent outline-none pl-2"
                  style={{ color: "#2e2e2e" }}
                />
                <input
                  type="text"
                  placeholder="--:--"
                  value={getDisplayTime()}
                  onChange={handleTimeInput}
                  maxLength={5}
                  className="date-time-input h-[21px] w-[40px] flex-shrink-0 text-sm bg-transparent outline-none ml-2"
                  style={{ color: "#2e2e2e" }}
                />
                <svg
                  className="w-4 h-4 flex-shrink-0 cursor-pointer mx-2"
                  fill="none"
                  stroke="#2e2e2e"
                  viewBox="0 0 24 24"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span
                  className="text-sm flex-shrink-0 h-full flex items-center justify-center border-l border-gray-200 cursor-pointer px-3 hover:bg-gray-200 transition-colors"
                  style={{ backgroundColor: "#F8F8F8", color: "#C8C8C8" }}
                  onClick={() => {
                    if (selectedDate && (manualDate || manualTime)) {
                      handleSchedule();
                    } else {
                      setShowCalendar(!showCalendar);
                    }
                  }}
                >
                  Reschedule
                </span>
              </div>
            </>
          ) : (
            <>
              {/* For authors in joined publications, show "Send for Review" button */}
              {/* Editors get same controls as admin (Publish + Schedule) */}
              {publicationId &&
              currentPublication &&
              !currentPublication.isOwner &&
              currentPublication.role === "author" ? (
                <button
                  className="flex items-center justify-center gap-2 h-8 rounded bg-gray-900 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                  style={{
                    minWidth: "74px",
                    width: "auto",
                    padding: "0 1rem",
                  }}
                  onClick={handleSendForReview}
                  disabled={isSaving}
                >
                  {isSaving ? "Sending..." : "Send for Review"}
                </button>
              ) : (
                <>
                  <button
                    className="md:w-40 flex items-center justify-center gap-2 h-8 rounded bg-gray-900 md:px-6 md:py-2 text-sm text-white hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap mobile-publish-btn"
                    onClick={handlePublish}
                    disabled={isSaving}
                  >
                    {isSaving ? "Publishing..." : "Publish"}
                    <img
                      src="/images/icons/Publish.svg"
                      alt="Publish"
                      className="w-4 h-4 brightness-0 invert"
                    />
                  </button>

                  <div className="flex items-center h-8 border border-gray-200 rounded overflow-hidden mobile-schedule-container">
                    <input
                      type="text"
                      placeholder="dd-mm-yyyy"
                      value={getDisplayDate()}
                      onChange={handleManualInput}
                      maxLength={10}
                      className="mobile-date-input date-time-input h-[21px] md:w-[95px] flex-shrink-0 text-sm bg-transparent outline-none pl-2"
                      style={{ color: "#2e2e2e" }}
                    />
                    <input
                      type="text"
                      placeholder="--:--"
                      value={getDisplayTime()}
                      onChange={handleTimeInput}
                      maxLength={5}
                      className="mobile-date-input date-time-input h-[21px] md:w-[40px] flex-shrink-0 text-sm bg-transparent outline-none md:ml-2"
                      style={{ color: "#2e2e2e" }}
                    />
                    <svg
                      className="w-4 h-4 flex-shrink-0 cursor-pointer md:mx-2"
                      fill="none"
                      stroke="#2e2e2e"
                      viewBox="0 0 24 24"
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span
                      className="mobile-schedule-btn md:text-sm text-xs flex-shrink-0 h-full flex items-center justify-center border-l border-gray-200 cursor-pointer md:px-3 hover:bg-gray-200 transition-colors"
                      style={{ backgroundColor: "#F8F8F8", color: "#C8C8C8" }}
                      onClick={() => {
                        // If date and time are already set, schedule directly
                        if (selectedDate && (manualDate || manualTime)) {
                          handleSchedule();
                        } else {
                          setShowCalendar(!showCalendar);
                        }
                      }}
                    >
                      Schedule
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className="fixed z-[1001] bg-white rounded flex"
          style={{
            gap: "15px",
            bottom: "88px",
            left: "50%",
            transform: "translateX(-50%)",
            border: "0.75px solid #B0B0B0",
            boxShadow: "8px 4px 30px 0px rgba(0,0,0,0.15)",
            padding: "16px",
          }}
        >
          {/* Calendar Section */}
          <div className="flex flex-col" style={{ width: "220px", gap: "8px" }}>
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-800">
                {monthNames[currentMonth]}, {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg
                    className="w-5 h-5 text-gray-800"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg
                    className="w-5 h-5 text-gray-800"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {renderCalendarDays()}
            </div>

            {/* Clear and Today buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleClearDate}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Clear
              </button>
              <button
                onClick={handleToday}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Today
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200" />

          {/* Time Picker Section */}
          <div
            className="flex flex-col"
            style={{
              width: "90px",
              gap: "8px",
              paddingRight: "8px",
              paddingLeft: "8px",
            }}
          >
            {/* Headers */}
            <div
              className="flex justify-between h-6 items-center"
              style={{ marginTop: "34px" }}
            >
              <span className="text-xs text-gray-500 w-7 text-center">
                Hour
              </span>
              <span className="text-xs text-gray-500 w-7 text-center">Min</span>
            </div>

            {/* Time columns */}
            <div
              className="flex justify-between"
              style={{ height: "104px", gap: "16px" }}
            >
              {/* Hours */}
              <div
                className="flex flex-col items-center overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {[...Array(24)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedHour(i);
                      const minuteStr = String(selectedMinute).padStart(2, "0");
                      setManualTime(
                        `${String(i).padStart(2, "0")}:${minuteStr}`,
                      );
                    }}
                    className={`w-7 h-6 text-xs rounded-md ${selectedHour === i ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    style={{
                      marginBottom: "2px",
                      flexShrink: 0,
                      ...(selectedHour === i
                        ? { backgroundColor: "#4B6CFB" }
                        : {}),
                    }}
                  >
                    {String(i).padStart(2, "0")}
                  </button>
                ))}
              </div>

              {/* Minutes */}
              <div
                className="flex flex-col items-center overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {[...Array(60)].map((_, m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMinute(m);
                      const hourStr = String(selectedHour).padStart(2, "0");
                      setManualTime(`${hourStr}:${String(m).padStart(2, "0")}`);
                    }}
                    className={`w-7 h-6 text-xs rounded-md ${selectedMinute === m ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    style={{
                      marginBottom: "2px",
                      flexShrink: 0,
                      ...(selectedMinute === m
                        ? { backgroundColor: "#4B6CFB" }
                        : {}),
                    }}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleSchedule}
              disabled={isSaving || !selectedDate}
              className="w-full py-1.5 text-sm text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ marginTop: "20px" }}
            >
              {isSaving ? "Scheduling..." : "Schedule"}
            </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div
            className="relative flex flex-col items-center"
            style={{
              width: "489px",
              height: "323.63px",
              borderRadius: "4px",
              padding: "56px 40px",
              gap: "32px",
              background: "#FEFEFE",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowPublishSuccess(false);
                router.push("/published?refresh=true");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Content Area - Icon + Text */}
            <div
              className="flex flex-col items-center"
              style={{
                width: "357px",
                height: "147.63px",
                gap: "16px",
              }}
            >
              {/* Paper Plane Icon with Checkmark */}
              <div className="relative">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path
                    d="M52 12L28 36M52 12L36 52L28 36M52 12L12 28L28 36"
                    stroke="#9CA3AF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Successfully Published
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Your blog is successfully Published, Click the below
                  <br />
                  button to view in site
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex items-center"
              style={{
                width: "229px",
                height: "32px",
                gap: "8px",
              }}
            >
              <button
                onClick={() => {
                  setShowPublishSuccess(false);
                  router.push("/published?refresh=true");
                }}
                style={{
                  width: "111px",
                  height: "32px",
                  borderRadius: "4px",
                  background: "#F8F8F8",
                  border: "1px solid #ECECEC",
                }}
                className="flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                See Later
              </button>
              <a
                href={
                  publishedBlogSlug
                    ? currentPublication?.subdomain
                      ? `http://${currentPublication.subdomain}.localhost:3000/view-site/blog/${publishedBlogSlug}`
                      : `/view-site/blog/${publishedBlogSlug}`
                    : currentPublication?.subdomain
                      ? `http://${currentPublication.subdomain}.localhost:3000`
                      : `/view-site?publicationId=${publicationId || currentPublication?.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setShowPublishSuccess(false);
                }}
                style={{
                  width: "110px",
                  height: "32px",
                  borderRadius: "4px",
                  background:
                    "linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)",
                }}
                className="flex items-center justify-center text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                View in Site
              </a>
            </div>
          </div>
        </div>
      )}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onDiscard={handleDiscard}
        onUpdate={handleUpdateAndExit}
      />
    </div>
  );
}
