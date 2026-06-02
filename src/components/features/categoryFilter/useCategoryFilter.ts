"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

interface UseCategoryFilterParams {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

interface UseCategoryFilterResult {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
  toggleCategory: (category: string) => void;
}

/**
 * Owns all stateful behaviour for the category filter: open/close state,
 * outside-click dismissal, and selection toggling. The component stays a thin
 * renderer (Step 4 — Hooks).
 */
export function useCategoryFilter({
  selectedCategories,
  onCategoriesChange,
}: UseCategoryFilterParams): UseCategoryFilterResult {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (category: string) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoriesChange(next);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return { isOpen, setIsOpen, dropdownRef, toggleCategory };
}
