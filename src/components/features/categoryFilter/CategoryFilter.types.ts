/**
 * Public contract for {@link CategoryFilter}.
 *
 * Every prop is explicitly typed — no `any`, no implicit object spread
 * (Step 4 — Types).
 */
export interface CategoryFilterProps {
  /** Currently selected category names. */
  selectedCategories?: string[];
  /** Called with the next selection whenever a category is toggled. */
  onCategoriesChange: (categories: string[]) => void;
  /** Label shown on the trigger when nothing is selected. */
  buttonText?: string;
  /** Disables the trigger and prevents the menu from opening. */
  disabled?: boolean;
}
