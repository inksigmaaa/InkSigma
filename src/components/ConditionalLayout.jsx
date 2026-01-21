"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import VisitSiteButton from "@/components/VisitSiteButton"
import FeedbackButton from "@/components/FeedbackButton"

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  
  // Memoize layout decision to prevent unnecessary re-evaluations
  const { useCustomLayout, showMobileButtons } = useMemo(() => {
    const isDashboardPage = pathname?.startsWith("/dashboard")
    const isSchedulePage = pathname === "/schedule"
    const isReviewPage = pathname === "/review"
    const isEditorPage = pathname === "/editor"
    const isPostsPage = pathname?.startsWith("/posts")
    const isPostsSettingsPage = pathname === "/posts/settings"
    const isMyBlogsPage = pathname === "/my-blogs"
    const isDraftPage = pathname === "/draft" || pathname === "/posts/draft"
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
    const isMembersDashboard = pathname === "/dashboard/members"
    const isPreview = pathname?.startsWith("/home/preview")
    const isLandingPage = pathname === "/"
    const isblog = pathname === "/posts/my-blogs"
    const ispostsmembers = pathname === "/posts/home"
    const ispostspublished = pathname === "/posts/published"
    const islogin = pathname === "/login"
    const issignup = pathname === "/signup"
    const isforgot = pathname === "/forgot-password"
    const isreset = pathname === "/reset-password"
    const iseditordashboard = pathname === "/editorpage"

    const customLayout = isDashboardPage || isSchedulePage || isReviewPage || isEditorPage || isPostsPage || isMyBlogsPage || isPublished || isDraftPage || isTrashPage || isUnpublishedPage || isCreatePublicationPage || isprofilesettings || isHome || isPostsSettingsPage || isAuthorReview || isMembersPage || isViewSitePage || ismembers || isMembersDashboard || isDomain || isPreview || isblog || ispostsmembers || ispostspublished || islogin || issignup || isforgot || isreset || iseditordashboard 

    const showButtons = !isCreatePublicationPage && !isPreview && !isDashboardPage && !isprofilesettings && !isPostsSettingsPage && !isEditorPage

    return {
      useCustomLayout: customLayout,
      showMobileButtons: showButtons
    }
  }, [pathname])

  if (useCustomLayout) {
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
      <main className="w-full max-w-[1920px] mx-auto bg-white">
        {children}
      </main>
      <Footer />
      {pathname !== "/" && (
        <>
          <VisitSiteButton />
          <FeedbackButton />
        </>
      )}
    </>
  )
}
