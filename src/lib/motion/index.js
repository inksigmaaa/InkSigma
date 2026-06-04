/**
 * "Ink & Paper" motion language for ink.
 * ------------------------------------------------------------------
 * One spring, one easing curve, a handful of variants — used everywhere
 * so the whole app feels like it was animated by one hand.
 *
 * Personality: things *settle*, they don't bounce. Entrances read like
 * ink soaking into paper (fade + a short rise, occasionally a soft blur).
 * Everything is fast (200–400ms) — a writing tool must never feel like
 * it's making you wait.
 *
 * Reduced motion: handled globally by <MotionProvider reducedMotion="user">
 * (see MotionProvider.jsx). Framer/Motion strips transforms + layout
 * animation for users who ask for it, keeping opacity only.
 */

// --- primitives -----------------------------------------------------

/** Confident ease-out. Decelerates hard, settles flat — no overshoot. */
export const EASE_INK = [0.22, 1, 0.36, 1];

/** A snappier in-out for things that move both ways (toggles, layout). */
export const EASE_INK_IN_OUT = [0.65, 0, 0.35, 1];

export const DURATION = {
  fast: 0.18,
  base: 0.3,
  slow: 0.45,
};

/** The house spring. Minimal overshoot — it lands, it doesn't wobble. */
export const SPRING = {
  type: "spring",
  stiffness: 220,
  damping: 30,
  mass: 0.9,
};

/** Softer spring for larger surfaces / shared-layout moves. */
export const SPRING_GENTLE = {
  type: "spring",
  stiffness: 170,
  damping: 26,
  mass: 1,
};

// --- variants -------------------------------------------------------

/**
 * Ink-bleed entrance: fade + short rise + a whisper of blur→sharp.
 * The signature move. Use for hero lines, sections, modals, cards-in-view.
 */
export const inkRise = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: DURATION.slow, ease: EASE_INK },
  },
};

/** Cheaper rise (no blur) — for long lists where blur would cost frames. */
export const rise = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_INK },
  },
};

export const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_INK } },
};

/** Pop-in for badges / icons / success seals. Spring so it feels alive. */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: SPRING },
};

// --- list orchestration --------------------------------------------

/**
 * Parent for staggered lists. `staggerChildren` is small and the total is
 * implicitly capped by how many children render — pair with `rise`/`inkRise`
 * children. delayChildren gives the container a beat before items cascade.
 */
export const staggerContainer = (stagger = 0.05, delay = 0.04) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** A list item that rises into place. Same curve as `rise`. */
export const staggerItem = rise;

// --- interaction presets (spread onto <motion.*>) ------------------

/** Gentle hover lift for cards — raise + settle, no bounce. */
export const hoverLift = {
  whileHover: { y: -4, transition: { duration: DURATION.fast, ease: EASE_INK } },
  whileTap: { scale: 0.99 },
};

/** Tactile press for buttons / icon actions. */
export const pressable = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
  transition: SPRING,
};
