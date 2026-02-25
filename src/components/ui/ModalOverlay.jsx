"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalOverlay({
  isOpen,
  onClose,
  children,
  zIndexClass = "z-[1000]",
  backdropClassName = "bg-black/50",
  contentPaddingClass = "p-4",
  lockScroll = true,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!isOpen || !lockScroll) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, lockScroll]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass}`}
      onClick={() => {
        if (closeOnBackdrop) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`absolute inset-0 ${backdropClassName}`} />
      <div
        className={`relative h-full w-full flex items-center justify-center ${contentPaddingClass}`}
      >
        <div onClick={(event) => event.stopPropagation()}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
