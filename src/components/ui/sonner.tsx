"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      position="top-right"
      richColors={false}
      toastOptions={{
        style: {
          background: "rgba(255, 255, 255, 0.78)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(0, 0, 0, 0.12)",
          color: "var(--foreground)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
        },
        classNames: {
          toast: "rounded-2xl",
          description: "text-foreground/80",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
