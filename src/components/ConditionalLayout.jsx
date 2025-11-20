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
  const isPostsSettingsPage = pathname === "/posts/settings"
  const isMyBlogsPage = pathname === "/my-blogs"
  const isDraftPage = pathname === "/draft"
  const isTrashPage = pathname === "/trash"
  const isPublished = pathname === "/published"
  const isUnpublishedPage = pathname === "/unpublished"
  const isMembersPage = pathname === "/members"
  const isAuthorReview = pathname === "/author-review"
  const isViewSitePage = pathname?.startsWith("/view-site")
  const isCreatePublicationPage = pathname === "/create-publication"
  const isDomain = pathname === "/domain"
  const isprofilesettings = pathname === "/profile-settings"
  const isHome = pathname === "/home"
  const ismembers = pathname === "/posts/members"
  const ispostMyblogs = pathname === "/posts/my-blogs"
  const isPosthome = pathname === "/posts/home"
  const ispostPublished = pathname === "/posts/published"
  const isPreview = pathname?.startsWith("/home/preview")
  const isLandingPage = pathname === "/"

  // Show mobile buttons on all pages except auth pages, create-publication page, and preview page
  const showMobileButtons = !isAuthPage && !isCreatePublicationPage && !isPreview

  

  if (isAuthPage || isDashboardPage ||isPosthome|| isSchedulePage ||ispostMyblogs||ispostPublished|| isReviewPage || isEditorPage || isPostsPage || isMyBlogsPage || isPublished || isDraftPage || isTrashPage || isUnpublishedPage || isCreatePublicationPage || isprofilesettings || isHome || isPostsSettingsPage || isAuthorReview || isMembersPage || isViewSitePage || ismembers || isDomain || isPreview) {
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
      {!isLandingPage && (
        <>
          <VisitSiteButton />
          <FeedbackButton />
        </>
      )}
    </>
  )
}