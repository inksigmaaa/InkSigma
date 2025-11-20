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
  const isPublished = pathname === "/published"
  const isUnpublishedPage = pathname === "/unpublished"
  const isMembersPage = pathname === "/members"
  const isHome = pathname === "/home"
  const isCreatePublicationPage = pathname === "/create-publication"
  const isDomain = pathname === "/domain"
  const isViewSitePage = pathname?.startsWith("/view-site")
  const isCreatePublicationPage = pathname === "/create-publication"
  const isDomain = pathname === "/domain"
  const isprofilesettings = pathname === "/profile-settings"
  const isHome = pathname === "/home"
  const ismembers = pathname === "/posts/members"
  const ispostMyblogs = pathname === "/posts/my-blogs"
  const isPosthome = pathname === "/posts/home"
  const ispostPublished = pathname === "/posts/published"
  const isMembersDashboard = pathname === "/dashboard/members"
  const isPreview = pathname?.startsWith("/home/preview")
  const isLandingPage = pathname === "/"
  const isblog = pathname === "/posts/my-blogs"
  const ispostsmembers = pathname === "/posts/home"
  const ispostspublished = pathname === "/posts/published"

  // Show mobile buttons on all pages except auth pages and create-publication page
  const showMobileButtons = !isAuthPage && !isCreatePublicationPage

  

  if (isAuthPage || isDashboardPage || isSchedulePage || isReviewPage || isEditorPage || isPostsPage || isMyBlogsPage || isPublished || isDraftPage || isTrashPage || isUnpublishedPage || isCreatePublicationPage || isMembersPage || isViewSitePage) {
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