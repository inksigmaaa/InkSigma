"use client"

import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastIcon,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  React.useEffect(() => {
    const timers = toasts.map((toast) => {
      if (toast.open) {
        return setTimeout(() => {
          dismiss(toast.id)
        }, 5000) // Auto dismiss after 5 seconds
      }
      return null
    }).filter(Boolean)

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [toasts, dismiss])

  return (
    <div className="fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:flex-col md:max-w-[420px]">
      {toasts
        .filter((toast) => toast.open)
        .map(function ({ id, title, description, action, variant = "default", ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="flex items-center gap-3">
                <ToastIcon variant={variant} />
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
              </div>
              {action}
              <ToastClose onClick={() => dismiss(id)} />
            </Toast>
          )
        })}
    </div>
  )
}