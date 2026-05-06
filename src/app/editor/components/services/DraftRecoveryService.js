"use client";

import { deleteDraft, getDraft } from "./DexieService";

export const TEMP_DRAFT_KEY_PREFIX = "inksigma:editor:draft";

export function getTempDraftStorageKey(publicationId, pathname) {
  if (typeof window === "undefined") return null;
  const publicationKey = publicationId || "default";
  const editorPath = pathname || window.location.pathname;
  return `${TEMP_DRAFT_KEY_PREFIX}:${editorPath}:${publicationKey}`;
}

export function readPersistedDraftId(publicationId, pathname) {
  const storageKey = getTempDraftStorageKey(publicationId, pathname);
  if (!storageKey || typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(storageKey);
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to read draft session key:", error);
    return null;
  }
}

export function persistDraftId(draftId, publicationId, pathname) {
  const storageKey = getTempDraftStorageKey(publicationId, pathname);
  if (!storageKey || !draftId || typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(storageKey, String(draftId));
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to persist draft session key:", error);
  }
}

export function clearPersistedDraftId(publicationId, pathname) {
  const storageKey = getTempDraftStorageKey(publicationId, pathname);
  if (!storageKey || typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.warn("[DraftRecoveryService] Failed to clear draft session key:", error);
  }
}

export function isUnsyncedDraft(draft) {
  return Boolean(
    draft?.lastModified && (!draft.syncedAt || draft.lastModified > draft.syncedAt),
  );
}

export async function getRecoverableDraft({ blogId, tempDraftId }) {
  const draftId = blogId || tempDraftId;
  if (!draftId) return null;

  const draft = await getDraft(String(draftId));
  return isUnsyncedDraft(draft) ? draft : null;
}

export async function clearRecoverableDraft(id) {
  if (!id) return;
  await deleteDraft(String(id));
}
