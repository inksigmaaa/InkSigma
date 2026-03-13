"use client"

import * as React from "react"
import { X } from "lucide-react"

import {
  AlertDialog as Dialog,
  AlertDialogPortal as DialogPortal,
  AlertDialogOverlay as DialogOverlay,
  AlertDialogTrigger as DialogTrigger,
  AlertDialogContent,
  AlertDialogHeader as DialogHeader,
  AlertDialogFooter as DialogFooter,
  AlertDialogTitle as DialogTitle,
  AlertDialogDescription as DialogDescription,
  AlertDialogCancel as DialogClose,
} from "./alert-dialog"

const DialogContent = React.forwardRef(
  ({ children, showClose = true, ...props }, ref) => (
    <AlertDialogContent ref={ref} {...props}>
      {children}
      {showClose && (
        <DialogClose
          asChild
          className="absolute right-4 top-4 mt-0 h-auto w-auto border-0 bg-transparent p-0 opacity-70 shadow-none ring-offset-white hover:bg-transparent hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 data-[state=open]:bg-transparent"
        >
          <button type="button" aria-label="Close dialog">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
      )}
    </AlertDialogContent>
  )
)
DialogContent.displayName = "DialogContent"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
