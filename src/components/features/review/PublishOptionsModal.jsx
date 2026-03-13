"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

/**
 * Modal for admin to choose between publishing or storing to unpublished when accepting a review article
 * For editors, only the unpublish option is shown
 */
export default function PublishOptionsModal({
  isOpen,
  onClose,
  onPublish,
  onUnpublish,
  articleTitle = "this article",
  userRole = "admin",
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePublish = async () => {
    setIsProcessing(true);
    try {
      await onPublish();
    } catch (error) {
      console.error("[PublishOptionsModal] Error publishing article:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsProcessing(true);
    try {
      await onUnpublish();
    } catch (error) {
      console.error(
        "[PublishOptionsModal] Error storing to unpublished:",
        error,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[420px]" showClose={false}>
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader className="text-center items-center space-y-4">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold">
              Article Accepted
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              What would you like to do with
              <br />
              <span className="font-medium text-gray-700">
                &quot;{articleTitle}&quot;
              </span>
              ?
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={handleUnpublish}
            disabled={isProcessing}
            className="flex-1 h-10 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Store to Unpublished"}
          </button>
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className="flex-1 h-10 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{
              background:
                "linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)",
            }}
          >
            {isProcessing ? "Publishing..." : "Publish Now"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
