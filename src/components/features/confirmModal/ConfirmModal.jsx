import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[408px]" showClose={false}>
        <button
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
          disabled={isProcessing}
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="text-center space-y-2">
          <DialogTitle
            className={`font-['Public_Sans'] font-bold text-base leading-[150%] ${titleColor}`}
          >
            {title}
          </DialogTitle>
          {message && (
            <DialogDescription className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4]">
              {message}
            </DialogDescription>
          )}
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
