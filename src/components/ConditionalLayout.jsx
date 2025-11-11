"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import VisitSiteButton from "@/components/VisitSiteButton"
import FeedbackButton from "@/components/FeedbackButton"

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/magic-link"
  const isDashboardPage = pathname?.startsWith("/dashboard")
  const isSchedulePage = pathname === "/schedule"
  const isReviewPage = pathname === "/review"
  const isEditorPage = pathname === "/editor"
  const isPostsPage = pathname === "/posts"
  const isMyBlogsPage = pathname === "/my-blogs"
  const isDraftPage = pathname === "/draft"
  const isTrashPage = pathname === "/trash"

  // Show mobile buttons on all pages except auth pages
  const showMobileButtons = !isAuthPage

  if (isAuthPage || isDashboardPage || isSchedulePage || isReviewPage || isEditorPage || isPostsPage || isMyBlogsPage || isDraftPage || isTrashPage) {
    return (
      <div className="min-h-screen">
        {children}
        {showMobileButtons && (
          <>
            <VisitSiteButton />
            <FeedbackButton />
          </>
        )}
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
      <VisitSiteButton />
      <FeedbackButton />
    </>
  )
}