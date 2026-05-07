"use client";

import { deleteDraft, getDraft } from "./DexieService";

export const TEMP_DRAFT_KEY_PREFIX = "inksigma:editor:draft";

// Scope draft recovery by (path, publication, articleKey). The articleKey is
// either the server article id (once we have one) or a per-mount localArticleId
// for brand-new articles. Without it, two unrelated "new article" sessions for
// the same publication would share recovery state.
export function getTempDraftStorageKey(publicationId, pathname, articleKey) {
  if (typeof window === "undefined") return null;
  const publicationKey = publicationId || "default";
  const editorPath = pathname || window.location.pathname;
  const scope = articleKey ? `:${articleKey}` : "";
  return `${TEMP_DRAFT_KEY_PREFIX}:${editorPath}:${publicationKey}${scope}`;
}

export function readPersistedDraftId(publicationId, pathname, articleKey) {
  const storageKey = getTempDraftStorageKey(publicationId, pathname, articleKey);
  if (!storageKey || typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(storageKey);
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to read draft session key:", error);
    return null;
  }
}

export function persistDraftId(draftId, publicationId, pathname, articleKey) {
  const storageKey = getTempDraftStorageKey(publicationId, pathname, articleKey);
  if (!storageKey || !draftId || typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, String(draftId));
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to persist draft session key:", error);
  }
}

export function clearPersistedDraftId(publicationId, pathname, articleKey) {
  const storageKey = getTempDraftStorageKey(publicationId, pathname, articleKey);
  if (!storageKey || typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to clear draft session key:", error);
  }
}

// ── Local article id (per-publication, per-tab) ────────────────────────────
// The localArticleId is the recovery scope for a brand-new article that
// doesn't yet have a server id. We persist it in sessionStorage so a page
// refresh during editing re-mounts with the same id and can recover the
// in-progress Dexie draft. sessionStorage is per-tab, so two tabs writing
// new articles in the same publication still get independent ids.
export const LOCAL_ARTICLE_ID_KEY_PREFIX = "inksigma:editor:localArticleId";

function getLocalArticleIdStorageKey(publicationId) {
  if (typeof window === "undefined") return null;
  const publicationKey = publicationId || "default";
  return `${LOCAL_ARTICLE_ID_KEY_PREFIX}:${publicationKey}`;
}

export function readLocalArticleId(publicationId) {
  const key = getLocalArticleIdStorageKey(publicationId);
  if (!key || typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to read local article id:", error);
    return null;
  }
}

export function writeLocalArticleId(publicationId, localArticleId) {
  const key = getLocalArticleIdStorageKey(publicationId);
  if (!key || !localArticleId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, String(localArticleId));
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to persist local article id:", error);
  }
}

export function clearLocalArticleId(publicationId) {
  const key = getLocalArticleIdStorageKey(publicationId);
  if (!key || typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to clear local article id:", error);
  }
}

export function isUnsyncedDraft(draft) {
  return Boolean(
    draft?.lastModified && (!draft.syncedAt || draft.lastModified > draft.syncedAt),
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isTempDraftId(id) {
  if (!id) return false;
  const value = String(id);
  return value.startsWith("temp_") || UUID_RE.test(value);
}

export async function getRecoverableDraft({ blogId, tempDraftId }) {
  const draftId = blogId || (isTempDraftId(tempDraftId) ? tempDraftId : null);
  if (!draftId) return null;

  const draft = await getDraft(String(draftId));
  return isUnsyncedDraft(draft) ? draft : null;
}

export async function clearRecoverableDraft(id) {
  if (!id) return;
  await deleteDraft(String(id));
}
