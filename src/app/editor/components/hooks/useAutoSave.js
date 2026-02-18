"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getApiBase } from "@/utils/apiBase";

const API_URL = getApiBase();

// Statuses that should never be auto-saved
const NON_DRAFT_STATUSES = ["published", "scheduled", "review", "unpublished"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; ++i) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

function normalizeContent(content) {
  if (!content) return "";
  if (content === "<p></p>") return "";
  return content;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Centralised auto-save logic for the editor.
 *
 * @param {Object} opts
 * @param {string|null}  opts.currentBlogId       – null for new articles
 * @param {string}       opts.title
 * @param {string}       opts.description
 * @param {string}       opts.contentHtml
 * @param {string[]}     opts.categories
 * @param {string|null}  opts.existingBlogStatus  – "draft" | "published" | …
 * @param {string|null}  opts.publicationId
 * @param {Object|null}  opts.currentPublication
 * @param {boolean}      opts.isSaving            – true while a manual save is in flight
 * @param {Function}     opts.saveFn              – (isAutoSave: boolean) => Promise<result|false>
 *        The parent provides this. It must handle the actual fetch, URL
 *        update, thumbnail upload, etc. The hook only decides *when* to call it.
 */
export function useAutoSave({
  currentBlogId,
  title,
  description,
  contentHtml,
  categories,
  existingBlogStatus,
  publicationId,
  currentPublication,
  isSaving,
  saveFn,
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ── Snapshots (set once when an article loads) ───────────────────────────
  const [snapshot, setSnapshot] = useState({
    title: "",
    description: "",
    contentHtml: "",
    categories: [],
  });

  // ── Refs (one unified "status" ref replaces 5 old refs) ──────────────────
  // Values: "idle" | "saving" | "publishing" | "navigating"
  const phaseRef = useRef("idle");
  const timerRef = useRef(null);
  // Keep latest values in a ref so event-handlers always see fresh data
  // without needing to re-register listeners on every keystroke.
  const latestRef = useRef({
    currentBlogId,
    title,
    description,
    contentHtml,
    categories,
    existingBlogStatus,
    publicationId,
    currentPublication,
    hasUnsavedChanges: false,
  });

  // Sync latestRef on every render
  latestRef.current = {
    currentBlogId,
    title,
    description,
    contentHtml,
    categories,
    existingBlogStatus,
    publicationId,
    currentPublication,
    hasUnsavedChanges,
  };

  // ── Public imperative helpers ────────────────────────────────────────────

  /** Call after a successful manual save to reset the snapshot. */
  const markSaved = useCallback(() => {
    phaseRef.current = "idle";
    setHasUnsavedChanges(false);
    setSnapshot({ title, description, contentHtml, categories });
  }, [title, description, contentHtml, categories]);

  /** Call before entering the publish flow. */
  const markPublishing = useCallback(() => {
    phaseRef.current = "publishing";
    cancelPendingAutoSave();
  }, []);

  /** Call before navigating away intentionally. */
  const markNavigating = useCallback(() => {
    phaseRef.current = "navigating";
    cancelPendingAutoSave();
  }, []);

  const cancelPendingAutoSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsAutoSaving(false);
  }, []);

  /** Reset the snapshot to the given values (e.g. after loading an article). */
  const resetSnapshot = useCallback((snap) => {
    setSnapshot(snap);
    setHasUnsavedChanges(false);
    phaseRef.current = "idle";
  }, []);

  // ── 1. Change detection ──────────────────────────────────────────────────

  useEffect(() => {
    const changed =
      title !== snapshot.title ||
      description !== snapshot.description ||
      normalizeContent(contentHtml) !==
        normalizeContent(snapshot.contentHtml) ||
      !arraysEqual(categories, snapshot.categories);

    setHasUnsavedChanges(changed);
  }, [title, description, contentHtml, categories, snapshot]);

  // ── 2. Debounced auto-save (drafts / new articles only) ──────────────────

  useEffect(() => {
    // Guard: don't auto-save if busy, no title, no changes, or non-draft status
    if (phaseRef.current !== "idle" || isSaving) return;
    if (!title.trim()) {
      setSaveStatus("idle");
      return;
    }
    if (!hasUnsavedChanges) return;

    const isDraftOrNew = !existingBlogStatus || existingBlogStatus === "draft";
    if (!isDraftOrNew) {
      setSaveStatus("idle");
      return;
    }

    // Clear any previous pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setTimeout(async () => {
      timerRef.current = null;

      // Re-check guards (state may have changed during the 1.5 s wait)
      if (phaseRef.current !== "idle") return;

      setIsAutoSaving(true);
      setSaveStatus("saving");

      const result = await saveFn(true); // isAutoSave = true
      setSaveStatus(result ? "saved" : "idle");
      setIsAutoSaving(false);

      if (result) {
        // Update snapshot so we don't re-trigger
        setSnapshot({
          title: latestRef.current.title,
          description: latestRef.current.description,
          contentHtml: latestRef.current.contentHtml,
          categories: latestRef.current.categories,
        });
      }
    }, 1500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    title,
    description,
    contentHtml,
    categories,
    hasUnsavedChanges,
    existingBlogStatus,
    isSaving,
    saveFn,
  ]);

  // ── 3. Page-leave & visibility-change saves ──────────────────────────────

  useEffect(() => {
    const canSaveOnLeave = () => {
      const l = latestRef.current;
      if (!l.hasUnsavedChanges || !l.title.trim()) return false;
      if (
        phaseRef.current === "publishing" ||
        phaseRef.current === "navigating"
      )
        return false;
      const isDraftOrNew =
        !l.existingBlogStatus || l.existingBlogStatus === "draft";
      return isDraftOrNew;
    };

    const isNonDraft = () => {
      const l = latestRef.current;
      return (
        l.existingBlogStatus &&
        NON_DRAFT_STATUSES.includes(l.existingBlogStatus)
      );
    };

    // ── beforeunload ────────────────────────────────────────────────────
    const handleBeforeUnload = (e) => {
      const l = latestRef.current;

      if (!l.hasUnsavedChanges || !l.title.trim()) return;
      if (
        phaseRef.current === "publishing" ||
        phaseRef.current === "navigating"
      )
        return;

      // Non-draft articles: warn user but don't save
      if (isNonDraft()) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }

      // Draft / new: fire-and-forget save via sendBeacon + keepalive fetch
      if (canSaveOnLeave()) {
        const blogData = {
          title: l.title,
          description: l.description,
          content: l.contentHtml,
          categories: l.categories,
          status: "draft",
          published: false,
        };

        const pubId = l.publicationId || l.currentPublication?.id;
        if (pubId) blogData.publicationId = parseInt(pubId);

        const createUrl = `${API_URL}/api/blogs/auto-save`;
        const updateUrl = `${API_URL}/api/blogs/${l.currentBlogId}`;
        const blob = new Blob([JSON.stringify(blogData)], {
          type: "application/json",
        });

        if (!l.currentBlogId) {
          navigator.sendBeacon(createUrl, blob);
        }

        fetch(l.currentBlogId ? updateUrl : createUrl, {
          method: l.currentBlogId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(blogData),
          keepalive: true,
        }).catch(() => {});
      }
    };

    // ── visibilitychange ────────────────────────────────────────────────
    const handleVisibilityChange = async () => {
      if (document.hidden && canSaveOnLeave()) {
        await saveFn(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveFn]); // intentionally minimal deps — reads from latestRef

  // ── Return ───────────────────────────────────────────────────────────────

  return {
    hasUnsavedChanges,
    saveStatus,
    setSaveStatus,
    isAutoSaving,
    markSaved,
    markPublishing,
    markNavigating,
    cancelPendingAutoSave,
    resetSnapshot,
  };
}
