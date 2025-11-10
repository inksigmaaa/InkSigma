"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password"
  const isDashboardPage = pathname?.startsWith("/dashboard")
  const isSchedulePage = pathname === "/schedule"
  const isReviewPage = pathname === "/review"
  const isEditorPage = pathname === "/editor"

  if (isAuthPage || isDashboardPage || isSchedulePage || isReviewPage || isEditorPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="">
        {children}
      </main>
      <Footer />
    </>
  )
}