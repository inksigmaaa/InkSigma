/**
 * Barrel for the CategoryFilter feature.
 *
 * Only re-exports from within this folder (Step 4 — "no barrel re-export
 * loops"). Consumers import the default component and, when needed, its props
 * type via the clean path `@/components/features/categoryFilter`.
 */
export { default } from "./CategoryFilter";
export type { CategoryFilterProps } from "./CategoryFilter.types";
export { BLOG_CATEGORIES, type BlogCategory } from "./categories";
