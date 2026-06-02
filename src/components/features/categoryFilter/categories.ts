/**
 * Canonical list of blog categories surfaced by the category filter.
 *
 * This is reference data, not presentation logic, so it lives outside the
 * component file (Step 4 — "zero business logic/data inside component files").
 * Hoist this to `@/constants` if a second feature ever needs the same list.
 */
export const BLOG_CATEGORIES = [
  "Technology",
  "Education",
  "Health & Wellness",
  "Lifestyle",
  "Finance",
  "Entertainment",
  "Business",
  "Personal Development",
  "Travel",
  "Food & Recipes",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
