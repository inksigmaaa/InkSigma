"use client";

import { MotionConfig } from "motion/react";
import { EASE_INK, DURATION } from "./index";

/**
 * App-wide motion defaults.
 *
 * `reducedMotion="user"` is the important bit: when a visitor has
 * "Reduce motion" enabled at the OS level, Motion automatically drops
 * transform + layout animations everywhere and keeps opacity only — so
 * we get accessibility for free without guarding every component.
 *
 * The default transition here is the house ease/duration, so any
 * `<motion.*>` that doesn't specify its own still feels like "ink".
 */
export default function MotionProvider({ children }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.base, ease: EASE_INK }}
    >
      {children}
    </MotionConfig>
  );
}
