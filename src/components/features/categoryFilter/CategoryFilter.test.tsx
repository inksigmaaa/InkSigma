/**
 * Colocated unit tests for CategoryFilter.
 *
 * NOTE: These require a unit-test runner that the repo does not yet have. The
 * project ships only `@playwright/test` (e2e). To run these, add:
 *   npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
 * a `vitest.config.ts` with `environment: "jsdom"`, a setup file importing
 * `@testing-library/jest-dom`, and a `"test": "vitest"` script. Until then this
 * file is the contract these tests will enforce, not executable CI.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CategoryFilter from "./CategoryFilter";
import { BLOG_CATEGORIES } from "./categories";

describe("CategoryFilter", () => {
  it("renders the default label when nothing is selected", () => {
    render(
      <CategoryFilter selectedCategories={[]} onCategoriesChange={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /choose category/i }),
    ).toBeInTheDocument();
  });

  it("shows a selection count when categories are selected", () => {
    render(
      <CategoryFilter
        selectedCategories={["Technology", "Finance"]}
        onCategoriesChange={() => {}}
      />,
    );
    expect(screen.getAllByText("2 selected").length).toBeGreaterThan(0);
  });

  it("opens the menu and lists every category", () => {
    render(
      <CategoryFilter selectedCategories={[]} onCategoriesChange={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button"));
    BLOG_CATEGORIES.forEach((category) => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it("adds an unselected category on click", () => {
    const onCategoriesChange = vi.fn();
    render(
      <CategoryFilter
        selectedCategories={[]}
        onCategoriesChange={onCategoriesChange}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Technology"));
    expect(onCategoriesChange).toHaveBeenCalledWith(["Technology"]);
  });

  it("removes an already-selected category on click", () => {
    const onCategoriesChange = vi.fn();
    render(
      <CategoryFilter
        selectedCategories={["Technology"]}
        onCategoriesChange={onCategoriesChange}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Technology"));
    expect(onCategoriesChange).toHaveBeenCalledWith([]);
  });

  it("does not open when disabled", () => {
    render(
      <CategoryFilter
        selectedCategories={[]}
        onCategoriesChange={() => {}}
        disabled
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Technology")).not.toBeInTheDocument();
  });
});
