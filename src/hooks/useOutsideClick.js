import { useEffect, useRef } from "react";

/**
 * Invoke `onOutsideClick` when a mousedown happens outside the element held by
 * `ref`. Only listens while `enabled` is true (e.g. while a dropdown is open),
 * matching the open-gated pattern these dropdowns use. The callback is read
 * through a ref so changing its identity does not re-subscribe the listener.
 *
 * @param {{ current: HTMLElement | null }} ref - element to treat as "inside"
 * @param {(event: MouseEvent) => void} onOutsideClick - called on outside click
 * @param {boolean} [enabled=true] - only listen while true
 */
export function useOutsideClick(ref, onOutsideClick, enabled = true) {
  const callbackRef = useRef(onOutsideClick);

  useEffect(() => {
    callbackRef.current = onOutsideClick;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const handleMouseDown = (event) => {
      const el = ref.current;
      if (el && !el.contains(event.target)) {
        callbackRef.current(event);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [enabled, ref]);
}
