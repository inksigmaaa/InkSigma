"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/magic-link"
  const isDashboardPage = pathname?.startsWith("/dashboard")
  const isSchedulePage = pathname === "/schedule" || pathname === "/scheduled"
  const isReviewPage = pathname === "/review"
  const isEditorPage = pathname === "/editor"
  const isPostsPage = pathname === "/posts"
  const isPublishedPage = pathname === "/published"
  const isCommentsPage = pathname === "/comments"
  const isDraftsPage = pathname === "/drafts"
  const isMyBlogsPage = pathname === "/myblogs"
  const isDraftPage = pathname === "/draft"
  const isTrashPage = pathname === "/trash"
  const isUnpublishedPage = pathname === "/unpublished"
  const isMembersPage = pathname === "/members"



  if (isAuthPage || isDashboardPage || isSchedulePage || isReviewPage || isEditorPage || isPostsPage || isMyBlogsPage || isDraftPage || isTrashPage || isUnpublishedPage || isMembersPage) {
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
