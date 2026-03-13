"use client";

import { useCallback, useState } from "react";

export function useExclusivePopup(initialPopup = null) {
  const [activePopup, setActivePopup] = useState(initialPopup);

  const isOpen = useCallback(
    (popupKey) => activePopup === popupKey,
    [activePopup]
  );

  const openPopup = useCallback((popupKey) => {
    setActivePopup(popupKey);
  }, []);

  const closePopup = useCallback((popupKey) => {
    setActivePopup((currentPopup) =>
      currentPopup === popupKey ? null : currentPopup
    );
  }, []);

  const togglePopup = useCallback((popupKey) => {
    setActivePopup((currentPopup) =>
      currentPopup === popupKey ? null : popupKey
    );
  }, []);

  const closeAllPopups = useCallback(() => {
    setActivePopup(null);
  }, []);

  return {
    activePopup,
    isOpen,
    openPopup,
    closePopup,
    togglePopup,
    closeAllPopups,
  };
}
