import { useEffect, useRef } from "react";

/**
 * Run `callback` every `intervalMs`, but ONLY while the browser tab is visible.
 *
 * When the tab is hidden the interval is cleared entirely (no background
 * polling); when it becomes visible again the callback fires immediately and
 * the interval resumes. This is the pattern PublicationContext already uses for
 * its membership poll — generalized so every dashboard poll can stop hammering
 * the backend from idle/background tabs.
 *
 * The callback is read through a ref so changing its identity each render does
 * not tear down and re-create the interval.
 *
 * @param {() => void} callback
 * @param {number} intervalMs
 * @param {{ enabled?: boolean }} [options]
 */
export function usePollingWhenVisible(callback, intervalMs, { enabled = true } = {}) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;

    let timer = null;
    const tick = () => callbackRef.current?.();

    const start = () => {
      stop();
      timer = setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        // Refresh immediately on return, then resume the interval.
        tick();
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    if (!document.hidden) {
      start();
    }

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
