import React from "react";
import ModalOverlay from "@/components/ui/ModalOverlay";

export default function ExitConfirmModal({
  isOpen,
  onClose,
  onDiscard,
  onUpdate,
}) {
  if (!isOpen) return null;

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      zIndexClass="z-[10001]"
      contentPaddingClass="px-4"
    >
      <div
        className="bg-white rounded-lg w-[408px] max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center flex flex-col gap-[9px]"
        style={{ padding: "40px 56px" }}
      >
        <h2 className="font-['Public_Sans'] font-bold text-base leading-[150%] text-black">
          Unsaved Changes
        </h2>
        <p className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4]">
          You have unsaved changes. Do you want to update them before exiting?
        </p>
        <div className="flex gap-2 mt-4 justify-center">
          <button
            className="font-['Public_Sans'] font-medium text-sm h-10 rounded bg-[#F5F5F5] text-[#A30000] hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            style={{ padding: "8px 32px" }}
            onClick={onDiscard}
          >
            Discard
          </button>
          <button
            className="font-['Public_Sans'] font-medium text-sm h-10 rounded bg-black text-white hover:opacity-90 transition-opacity duration-200 whitespace-nowrap"
            style={{ padding: "8px 32px" }}
            onClick={onUpdate}
          >
            Update
          </button>
        </div>
        <button
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 1L1 11M1 1L11 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </ModalOverlay>
  );
}
