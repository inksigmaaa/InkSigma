"use client";

import Dexie from "dexie";

// ── Single Dexie database for editor drafts ──────────────────────────────────
// IndexedDB is async and non-blocking, so writes never stall the UI thread.

const db = new Dexie("InkSigmaDrafts");

db.version(1).stores({
  // postId is the primary key; lastModified & syncedAt are indexed for queries
  drafts: "postId, lastModified, syncedAt",
});

const draftsTable = db.drafts;

/**
 * Upsert a draft. Called on every keystroke — IndexedDB handles this
 * efficiently because it's a single-row put, not a full-table rewrite.
 */
export async function saveDraft(
  postId,
  { title, description, content, categories },
) {
  try {
    await draftsTable.put({
      postId,
      title: title || "",
      description: description || "",
      content: content || "",
      categories: categories || [],
      lastModified: Date.now(),
      // Don't touch syncedAt — only markSynced does that
    });
  } catch (err) {
    console.warn("[DexieService] saveDraft failed:", err);
  }
}

/**
 * Read a draft by postId. Returns null if not found.
 */
export async function getDraft(postId) {
  try {
    const draft = await draftsTable.get(postId);
    return draft || null;
  } catch (err) {
    console.warn("[DexieService] getDraft failed:", err);
    return null;
  }
}

/**
 * Stamp the draft with syncedAt after a successful server save.
 * This lets us know the server has this version.
 */
export async function markSynced(postId) {
  try {
    await draftsTable.update(postId, { syncedAt: Date.now() });
  } catch (err) {
    console.warn("[DexieService] markSynced failed:", err);
  }
}

/**
 * Remove a draft entirely (e.g. after publish or discard).
 */
export async function deleteDraft(postId) {
  try {
    await draftsTable.delete(postId);
  } catch (err) {
    console.warn("[DexieService] deleteDraft failed:", err);
  }
}

/**
 * Rename the postId key. Used when a new post gets its real server ID
 * after the first successful save (temp UUID → real ID).
 */
export async function remapDraftId(oldId, newId) {
  try {
    const existing = await draftsTable.get(oldId);
    if (existing) {
      await draftsTable.put({ ...existing, postId: newId });
      await draftsTable.delete(oldId);
    }
  } catch (err) {
    console.warn("[DexieService] remapDraftId failed:", err);
  }
}
