"use client";

import { motion } from "motion/react";
import { EASE_INK, DURATION } from "@/lib/motion";

/**
 * Page transition wrapper — fades content in as it mounts.
 *
 * Previously this used a setTimeout(50ms) + mount flag, which left every
 * page rendered fully invisible until the timer fired (a visible flash /
 * perceived lag). Motion animates on mount via rAF instead — no artificial
 * delay — and <MotionProvider reducedMotion="user"> respects the OS
 * "Reduce motion" preference.
 *
 * IMPORTANT: this is opacity-only — NO transform. Several pages render their
 * content as position:absolute (the dashboard article lists use
 * `absolute left-1/2 top-[160px]`). A transformed ancestor becomes the
 * containing block for absolutely-positioned descendants, so animating `y`
 * here re-anchored the list mid-flight and snapped its position when the
 * transform settled — the cards (2nd onward) visibly jumped on entry. Page
 * = fade; the per-item rise lives on the cards themselves.
 *
 * On client navigation the route subtree remounts, so this replays per page.
 */
export default function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.base, ease: EASE_INK }}
    >
      {children}
    </motion.div>
  );
}
