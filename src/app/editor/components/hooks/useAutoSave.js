"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  saveDraft as dexieSave,
  markSynced as dexieMarkSynced,
  deleteDraft as dexieDelete,
  remapDraftId,
} from "../services/DexieService";
import {
  clearPersistedDraftId,
  isTempDraftId,
  persistDraftId,
  readPersistedDraftId,
} from "../services/DraftRecoveryService";
import { getApiBase } from "@/utils/apiBase";

const API_URL = getApiBase();

// Statuses that should never be auto-saved to the server
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

function hasDraftData({
  title,
  description,
  contentHtml,
  categories,
  hasAdditionalDraftData = false,
}) {
  return Boolean(
    (title && title.trim()) ||
    (description && description.trim()) ||
    normalizeContent(contentHtml) ||
    (Array.isArray(categories) && categories.length > 0) ||
    hasAdditionalDraftData,
  );
}

/** Wait ms milliseconds (for retry backoff). */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Centralised auto-save: Dexie keystroke save + debounced server sync.
 *
 * Architecture rules:
 *   - All editor reads happen via refs (never triggers TipTap re-render)
 *   - Save status state lives here, outside the editor component
 *   - AbortController cancels in-flight requests before firing new ones
 *   - Retry up to 3× with exponential backoff on failure
 *   - Offline-aware: skips server sync when navigator.onLine is false
 */
export function useAutoSave({
  currentBlogId,
  shadowId, // server-created ID stored silently during auto-save (lives in a ref in the parent)
  title,
  description,
  contentHtml,
  categories,
  extraDirtySignal = "none",
  hasAdditionalDraftData = false,
  existingBlogStatus,
  publicationId,
  currentPublication,
  isSaving,
  saveFn,
  onBlogIdCreated, // callback(newId) — called when first server save returns an ID
}) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'failed'
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // ── Snapshots (baseline for change detection) ──────────────────────────────
  const [snapshot, setSnapshot] = useState({
    title: "",
    description: "",
    contentHtml: "",
    categories: [],
    extraDirtySignal: "none",
  });

  const hasUnsavedChanges =
    title !== snapshot.title ||
    description !== snapshot.description ||
    normalizeContent(contentHtml) !== normalizeContent(snapshot.contentHtml) ||
    !arraysEqual(categories, snapshot.categories) ||
    extraDirtySignal !== snapshot.extraDirtySignal;

  // ── Refs ────────────────────────────────────────────────────────────────────
  // "phase" prevents overlapping saves during publish/navigation
  const phaseRef = useRef("idle"); // "idle" | "saving" | "publishing" | "navigating"
  const timerRef = useRef(null);
  const abortRef = useRef(null); // AbortController for in-flight server request
  const retryCountRef = useRef(0);

  // Temp UUID for new posts that don't have a server ID yet
  const tempIdRef = useRef(null);

  // Always-current values readable from event handlers without re-registering
  const latestRef = useRef({
    currentBlogId,
    shadowId,
    title,
    description,
    contentHtml,
    categories,
    extraDirtySignal,
    hasAdditionalDraftData,
    existingBlogStatus,
    publicationId,
    currentPublication,
    hasUnsavedChanges: false,
  });

  useEffect(() => {
    latestRef.current = {
      currentBlogId,
      shadowId,
      title,
      description,
      contentHtml,
      categories,
      extraDirtySignal,
      hasAdditionalDraftData,
      existingBlogStatus,
      publicationId,
      currentPublication,
      hasUnsavedChanges,
    };
  }, [
    currentBlogId,
    shadowId,
    title,
    description,
    contentHtml,
    categories,
    extraDirtySignal,
    hasAdditionalDraftData,
    existingBlogStatus,
    publicationId,
    currentPublication,
    hasUnsavedChanges,
  ]);

  // ── Dexie postId resolver ──────────────────────────────────────────────────
  // For new posts we need a stable ID for Dexie before the server gives us one.

  const getDexieId = useCallback(() => {
    if (currentBlogId) return String(currentBlogId);
    if (shadowId) return String(shadowId);
    if (tempIdRef.current) return tempIdRef.current;

    const persistedDraftId = readPersistedDraftId(publicationId);
    if (isTempDraftId(persistedDraftId)) {
      tempIdRef.current = persistedDraftId;
      return persistedDraftId;
    }
    if (persistedDraftId) {
      clearPersistedDraftId(publicationId);
    }

    if (!tempIdRef.current) {
      tempIdRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      persistDraftId(tempIdRef.current, publicationId);
    }
    return tempIdRef.current;
  }, [currentBlogId, shadowId, publicationId]);

  useEffect(() => {
    if (!currentBlogId) return;
    clearPersistedDraftId(publicationId);
    tempIdRef.current = null;
  }, [currentBlogId, publicationId]);

  // ── 1. Keystroke-level Dexie save ──────────────────────────────────────────
  // Runs on every content change. Non-blocking, never causes re-render.

  useEffect(() => {
    // Skip if there's truly nothing to save
    if (!title && !description && !normalizeContent(contentHtml)) return;

    const id = getDexieId();
    // Fire-and-forget — Dexie writes are fast (~1ms) and async
    dexieSave(id, { title, description, content: contentHtml, categories });
  }, [title, description, contentHtml, categories, getDexieId]);

  // ── Server save with retry (up to 3×, exponential backoff) ─────────────────

  const serverSaveWithRetry = useCallback(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await saveFn(true); // isAutoSave = true
        if (result?.skipped) {
          return "skipped";
        }
        if (result?.thumbnailUploadFailed) {
          throw new Error("Thumbnail upload failed");
        }
        if (result) {
          // If this was a new post and server returned an ID, remap Dexie
          if (!latestRef.current.currentBlogId && result.id != null) {
            const oldDexieId = tempIdRef.current;
            const newId = String(result.id);
            if (oldDexieId && oldDexieId !== newId) {
              await remapDraftId(oldDexieId, newId);
            }
            tempIdRef.current = newId;
            clearPersistedDraftId(latestRef.current.publicationId);
            onBlogIdCreated?.(result);
          }
          return {
            savedSnapshot: result.__savedSnapshot || null,
          };
        }
        return false;
      } catch (err) {
        if (err.name === "AbortError") return false; // Intentionally cancelled
        console.warn(`[useAutoSave] attempt ${attempt + 1} failed:`, err);
        if (attempt < 2) {
          await wait(Math.pow(2, attempt) * 1000); // 1s, 2s backoff
        }
      }
    }
    return false;
  }, [saveFn, onBlogIdCreated]);

  // ── 3. Debounced server sync ───────────────────────────────────────────────

  useEffect(() => {
    if (phaseRef.current !== "idle" || isSaving) return;
    if (
      !hasDraftData({
        title,
        description,
        contentHtml,
        categories,
        hasAdditionalDraftData,
      })
    ) {
      return;
    }
    if (!hasUnsavedChanges) return;

    const isDraftOrNew = !existingBlogStatus || existingBlogStatus === "draft";
    if (!isDraftOrNew) return;

    // Clear previous pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      if (phaseRef.current !== "idle") return;

      // Cancel any in-flight request before starting a new one
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      // Skip server sync if offline — Dexie already has the data
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSaveStatus("idle");
        return;
      }

      setIsAutoSaving(true);
      setSaveStatus("saving");

      const success = await serverSaveWithRetry();
      setSaveStatus(
        success === "skipped" ? "idle" : success ? "saved" : "failed",
      );
      setIsAutoSaving(false);

      if (success && success !== "skipped") {
        const dexieId = getDexieId();
        dexieMarkSynced(dexieId);
        retryCountRef.current = 0;

        // Update snapshot so change detection doesn't re-trigger
        if (success.savedSnapshot) {
          setSnapshot(success.savedSnapshot);
        }
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
    hasAdditionalDraftData,
    existingBlogStatus,
    isSaving,
    getDexieId,
    serverSaveWithRetry,
  ]);

  // ── 4. Online/offline listener ─────────────────────────────────────────────
  // When coming back online, trigger a save if there are pending changes.

  useEffect(() => {
    const handleOnline = () => {
      const l = latestRef.current;
      if (
        l.hasUnsavedChanges &&
        hasDraftData({
          title: l.title,
          description: l.description,
          contentHtml: l.contentHtml,
          categories: l.categories,
          hasAdditionalDraftData: l.hasAdditionalDraftData,
        })
      ) {
        // Clear existing timer and trigger a save soon
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
          timerRef.current = null;
          if (phaseRef.current !== "idle") return;
          setIsAutoSaving(true);
          setSaveStatus("saving");
          const success = await serverSaveWithRetry();
          setSaveStatus(
            success === "skipped"
              ? "idle"
              : success
                ? "saved"
                : "failed",
          );
          setIsAutoSaving(false);
          if (success && success !== "skipped") {
            dexieMarkSynced(getDexieId());
            if (success.savedSnapshot) {
              setSnapshot(success.savedSnapshot);
            }
          }
        }, 500);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [serverSaveWithRetry, getDexieId, hasAdditionalDraftData]);

  // ── 5. Page-leave & visibility-change saves ────────────────────────────────

  useEffect(() => {
    const canSaveOnLeave = () => {
      const l = latestRef.current;
      if (
        !l.hasUnsavedChanges ||
        !hasDraftData({
          title: l.title,
          description: l.description,
          contentHtml: l.contentHtml,
          categories: l.categories,
          hasAdditionalDraftData: l.hasAdditionalDraftData,
        })
      ) {
        return false;
      }
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

    const handleBeforeUnload = (e) => {
      const l = latestRef.current;
      if (
        !l.hasUnsavedChanges ||
        !hasDraftData({
          title: l.title,
          description: l.description,
          contentHtml: l.contentHtml,
          categories: l.categories,
          hasAdditionalDraftData: l.hasAdditionalDraftData,
        })
      ) {
        return;
      }
      if (
        phaseRef.current === "publishing" ||
        phaseRef.current === "navigating"
      )
        return;

      // Non-draft: warn but don't save
      if (isNonDraft()) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }

      // Draft / new: sendBeacon as last-character safety net
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

        const effectiveId = l.currentBlogId || l.shadowId;
        const url = effectiveId
          ? `${API_URL}/api/blogs/${effectiveId}`
          : `${API_URL}/api/blogs/auto-save`;
        const method = effectiveId ? "PUT" : "POST";

        // Existing drafts need PUT; sendBeacon cannot choose the HTTP method.
        if (effectiveId) {
          fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(blogData),
            keepalive: true,
          }).catch(() => {});
          return;
        }

        // New drafts can use the beacon POST path as a last-character safety net.
        const blob = new Blob([JSON.stringify(blogData)], {
          type: "application/json",
        });

        if (typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(url, blob);
          return;
        }

        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(blogData),
          keepalive: true,
        }).catch(() => {});
      }
    };

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
  }, [saveFn]);

  // ── Public imperative helpers ──────────────────────────────────────────────

  const markSaved = useCallback(({
    preserveExtraDirty = false,
    nextExtraDirtySignal,
    savedSnapshot,
  } = {}) => {
    phaseRef.current = "idle";
    setSnapshot(
      savedSnapshot || {
        title,
        description,
        contentHtml,
        categories,
        extraDirtySignal: preserveExtraDirty
          ? snapshot.extraDirtySignal
          : (nextExtraDirtySignal ?? extraDirtySignal),
      },
    );

    // Mark Dexie as synced and clear retry counter
    const id = currentBlogId
      ? String(currentBlogId)
      : shadowId
        ? String(shadowId)
        : tempIdRef.current;
    if (id) dexieMarkSynced(id);
    retryCountRef.current = 0;
  }, [
    title,
    description,
    contentHtml,
    categories,
    extraDirtySignal,
    snapshot.extraDirtySignal,
    currentBlogId,
    shadowId,
  ]);

  const cancelPendingAutoSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsAutoSaving(false);
  }, []);

  const markPublishing = useCallback(() => {
    phaseRef.current = "publishing";
    cancelPendingAutoSave();
  }, [cancelPendingAutoSave]);

  const markNavigating = useCallback(() => {
    phaseRef.current = "navigating";
    cancelPendingAutoSave();
  }, [cancelPendingAutoSave]);

  const resetSnapshot = useCallback((snap) => {
    setSnapshot({
      title: snap?.title || "",
      description: snap?.description || "",
      contentHtml: snap?.contentHtml || "",
      categories: snap?.categories || [],
      extraDirtySignal: snap?.extraDirtySignal || "none",
    });
    phaseRef.current = "idle";
  }, []);

  const syncExtraDirtySignal = useCallback((nextExtraDirtySignal) => {
    setSnapshot((current) => ({
      ...current,
      extraDirtySignal: nextExtraDirtySignal ?? extraDirtySignal,
    }));
  }, [extraDirtySignal]);

  /** Clean up Dexie draft after publish or discard. */
  const clearDraft = useCallback(() => {
    const id = currentBlogId
      ? String(currentBlogId)
      : shadowId
        ? String(shadowId)
        : tempIdRef.current;
    if (id) dexieDelete(id);
    // Also clear temp ID entry if it exists
    if (tempIdRef.current && currentBlogId) {
      dexieDelete(tempIdRef.current);
    }
    tempIdRef.current = null;
    clearPersistedDraftId(publicationId);
  }, [currentBlogId, shadowId, publicationId]);

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
    syncExtraDirtySignal,
    clearDraft,
    getDexieId,
  };
}
