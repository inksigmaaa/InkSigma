import { useEffect, useState } from "react";
import ModalOverlay from "@/components/ui/ModalOverlay";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmStyle = "danger",
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Red title for danger actions (trash/delete), black title for normal actions (restore/confirm)
  const titleColor =
    confirmStyle === "danger" ? "text-[#f13434]" : "text-black";

  const handleClose = () => {
    if (isProcessing) return;
    onClose?.();
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm?.();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={handleClose}
      zIndexClass="z-[10001]"
      contentPaddingClass="px-4"
    >
      <div
        className="bg-white rounded-lg w-[408px] max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center flex flex-col gap-[9px]"
        style={{ padding: "40px 56px" }}
      >
        <h2
          className={`font-['Public_Sans'] font-bold text-base leading-[150%] ${titleColor}`}
        >
          {title}
        </h2>
        {message && (
          <p className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4]">
            {message}
          </p>
        )}
        <div className="flex gap-2 mt-4 justify-center">
          <button
            className="font-['Public_Sans'] font-medium text-sm h-10 rounded bg-[#F5F5F5] text-[#4A4A4A] hover:bg-gray-200 transition-colors duration-200"
            style={{ padding: "8px 32px" }}
            onClick={handleClose}
            disabled={isProcessing}
          >
            Close
          </button>
          <button
            className="font-['Public_Sans'] font-medium text-sm h-10 rounded bg-black text-white hover:opacity-90 transition-opacity duration-200 whitespace-nowrap"
            style={{ padding: "8px 32px" }}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
