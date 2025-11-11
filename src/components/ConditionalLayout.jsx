"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/magic-link"
  const isDashboardPage = pathname?.startsWith("/dashboard")
  const isSchedulePage = pathname === "/schedule"
  const isReviewPage = pathname === "/review"
  const isEditorPage = pathname === "/editor"
  const isPostsPage = pathname === "/posts"
  const isViewSitePage = pathname?.startsWith("/view_site")
  const isMyBlogsPage = pathname === "/my-blogs"
  const isDraftPage = pathname === "/draft"
  const isTrashPage = pathname === "/trash"
  const isDomainPage = pathname === "/domain"

  if (isAuthPage || isDashboardPage || isSchedulePage || isReviewPage || isEditorPage || isPostsPage || isViewSitePage || isMyBlogsPage || isDraftPage || isTrashPage || isDomainPage) {
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