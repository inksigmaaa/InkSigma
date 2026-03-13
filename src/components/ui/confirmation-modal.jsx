"use client"

import { useState, useEffect } from "react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  confirmText = "Confirm",
  cancelText = "Close",
  confirmVariant = "default",
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false)
    }
  }, [isOpen])

  const handleClose = () => {
    if (isProcessing) return
    onClose?.()
  }

  const handleConfirm = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await onConfirm?.()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]" showClose={true}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
