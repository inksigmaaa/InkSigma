import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function ExitConfirmModal({
  isOpen,
  onClose,
  onDiscard,
  onUpdate,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[408px]" showClose={false}>
        <button
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="font-['Public_Sans'] font-bold text-base leading-[150%] text-black">
            Unsaved Changes
          </DialogTitle>
          <DialogDescription className="font-['Public_Sans'] font-normal text-sm leading-[150%] text-[#A4A4A4]">
            You have unsaved changes. Do you want to update them before exiting?
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
