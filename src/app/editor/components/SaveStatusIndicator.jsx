"use client";

import { AnimatePresence, motion } from "motion/react";
import { EASE_INK } from "@/lib/motion";

/**
 * SaveStatusIndicator – lives outside the TipTap editor.
 * Renders "Saving..." | "Saved ✓" | "Failed ⚠" based on status prop.
 * No save logic here — single responsibility: display.
 *
 * Motion: the three states cross-fade (AnimatePresence, mode="wait") and the
 * "Saved" checkmark *draws itself* every time a save lands — a small, quiet
 * "it's handled" beat that never pulls focus from writing.
 */
export default function SaveStatusIndicator({
  saveStatus,
  isAutoSaving,
  hasContent,
}) {
  // Don't render if there's nothing to show
  if (!hasContent || (!isAutoSaving && saveStatus === "idle")) return null;

  const isSaving = isAutoSaving || saveStatus === "saving";
  const isFailed = saveStatus === "failed";
  const state = isSaving ? "saving" : isFailed ? "failed" : "saved";

  const labelStyle = {
    fontFamily: "Public Sans",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "150%",
    letterSpacing: "0%",
  };

  return (
    <div
      className="hidden md:flex items-center flex-shrink-0"
      style={{
        width: isSaving ? "98px" : isFailed ? "88px" : "78px",
        height: "32px",
        borderRadius: "4px",
        border: `1px solid ${isFailed ? "#FCA5A5" : "#EAEAEA"}`,
        padding: "6px 8px",
        gap: "8px",
        transition: "width 0.2s ease, border-color 0.2s ease",
        backgroundColor: isFailed ? "#FEF2F2" : undefined,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isSaving ? (
          <motion.div
            key="saving"
            className="flex items-center"
            style={{ gap: "8px" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE_INK }}
          >
            <div className="animate-spin h-3.5 w-3.5 border-2 border-gray-200 border-t-blue-600 rounded-full" />
            <span style={{ ...labelStyle, color: "#696969" }}>Saving...</span>
          </motion.div>
        ) : isFailed ? (
          <motion.div
            key="failed"
            className="flex items-center"
            style={{ gap: "8px" }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_INK }}
          >
            <span style={{ fontSize: "14px" }}>⚠</span>
            <span style={{ ...labelStyle, color: "#DC2626" }}>Failed</span>
          </motion.div>
        ) : (
          <motion.div
            key="saved"
            className="flex items-center"
            style={{ gap: "8px" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_INK }}
          >
            <motion.svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              aria-hidden="true"
            >
              <motion.path
                d="M2.5 7.5L5.5 10.5L11.5 4"
                stroke="#267F24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.32, ease: EASE_INK, delay: 0.04 }}
              />
            </motion.svg>
            <span style={{ ...labelStyle, color: "#696969" }}>Saved</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
