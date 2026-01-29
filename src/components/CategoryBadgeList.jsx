"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";

export default function CategoryBadgeList({ categories }) {
  const containerRef = useRef(null);
  const ghostRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(categories.length);

  // We use a ghost container to measure items
  useEffect(() => {
    const measure = () => {
      if (
        !ghostRef.current ||
        !containerRef.current ||
        categories.length === 0
      ) {
        setVisibleCount(categories.length); // If no categories or refs not ready, show all
        return;
      }

      const containerWidth = containerRef.current.clientWidth;
      const children = Array.from(ghostRef.current.children); // These are the full list of categories
      const gap = 8;
      const badgeWidthEstimate = 45; // Estimate for "+N" badge

      let currentFitCount = 0;
      let currentWidth = 0;

      // First pass: try to fit as many items as possible without considering the badge
      for (let i = 0; i < children.length; i++) {
        const childWidth = children[i].offsetWidth;
        if (currentWidth + childWidth + (i > 0 ? gap : 0) <= containerWidth) {
          currentWidth += childWidth + (i > 0 ? gap : 0);
          currentFitCount = i + 1;
        } else {
          break; // This item doesn't fit
        }
      }

      // If all items fit, or no items, we are done.
      if (currentFitCount === categories.length || categories.length === 0) {
        setVisibleCount(categories.length);
        return;
      }

      // If not all items fit, we need to make space for the "+N" badge.
      // We need to find the maximum number of items (k) such that
      // width(item_0...item_k-1) + (k-1)*gap + badgeWidthEstimate <= containerWidth
      let finalFitCount = 0;
      let widthWithBadge = 0;

      for (let i = 0; i < categories.length; i++) {
        const childWidth = children[i].offsetWidth;
        const potentialWidth = widthWithBadge + childWidth + (i > 0 ? gap : 0);

        // Check if adding this item AND the badge would fit
        if (potentialWidth + badgeWidthEstimate <= containerWidth) {
          widthWithBadge = potentialWidth;
          finalFitCount = i + 1;
        } else {
          break; // This item doesn't fit with the badge
        }
      }

      // Ensure at least one item is shown if possible, unless container is too small for even one item + badge
      if (finalFitCount === 0 && categories.length > 0) {
        // If no items fit with the badge, try to fit just the first item (if it fits)
        // This handles cases where the first item itself is too wide for (item + badge)
        if (children[0].offsetWidth <= containerWidth) {
          finalFitCount = 1;
        }
      }

      setVisibleCount(finalFitCount);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [categories]);

  return (
    <div className="relative w-full overflow-hidden" ref={containerRef}>
      {/* Visible List */}
      <div className="flex flex-nowrap items-center gap-2 w-full">
        {categories.slice(0, visibleCount).map((category, index) => (
          <span
            key={index}
            className="px-4 py-1.5 text-[#7C7C7C] border rounded-lg border-[#ECECEC] max-md:rounded-md text-xs md:text-sm max-md:px-3 max-md:py-1.5 hover:bg-gray-50 transition-colors text-sm font-normal leading-normal tracking-normal whitespace-nowrap block"
          >
            {category}
          </span>
        ))}
        {categories.length > visibleCount && (
          <span className="px-4 py-1.5 text-[#7C7C7C] border rounded-lg border-[#ECECEC] max-md:rounded-md text-xs md:text-sm max-md:px-3 max-md:py-1.5 hover:bg-gray-50 transition-colors text-sm font-normal leading-normal tracking-normal whitespace-nowrap">
            +{categories.length - visibleCount}
          </span>
        )}
      </div>

      {/* Ghost List for Measurement - Absolute and hidden but rendered to measure widths */}
      <div
        ref={ghostRef}
        className="flex flex-nowrap items-center gap-2 absolute top-0 left-0 invisible opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        {categories.map((category, index) => (
          <span
            key={index}
            // Apply relevant styling for accurate measurement (dimensions, padding, border, font)
            className="px-4 py-1.5 border rounded-lg border-[#ECECEC] max-md:rounded-md text-xs md:text-sm max-md:px-3 max-md:py-1.5 text-sm font-normal leading-normal tracking-normal whitespace-nowrap block"
          >
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}
