"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import FeedbackButton from "@/components/FeedbackButton"

export default function ConditionalLayout({
  children,
  isDashboardHost: isDashboardHostProp = false,
  isPublicationSubdomain: isPublicationSubdomainProp = false
}) {
  const pathname = usePathname()
  const isDashboardHost = Boolean(isDashboardHostProp)
  const isPublicationSubdomain = Boolean(isPublicationSubdomainProp)

  // Memoize layout decision to prevent unnecessary re-evaluations
  const { useCustomLayout, showMobileButtons, isLandingPage } = useMemo(() => {
    // On the dashboard host we use the public URL shape:
    // ... (rest of normalizeDashboardPath) ...
    const normalizeDashboardPath = (p) => {
      // ... same logic ...
      if (!isDashboardHost) return p;
      if (!p) return p;
      if (p === "/") return p;

      const PUBLIC_PREFIXES = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/magic-link",
        "/auth-callback",
        "/create-publication",
        "/invite",
        "/view-site",
        "/profile-settings", // User-level settings, not publication-specific
      ];
      const OLD_ENDPOINTS = [
        "/home",
        "/posts",
        "/review",
        "/author-review",
        "/editor",
        "/draft",
        "/published",
        "/unpublished",
        "/trash",
        "/schedule",
        "/members",
        "/my-blogs",
        "/domain",
        "/dashboard",
      ];

      const isPublic = PUBLIC_PREFIXES.some(
        (prefix) => p === prefix || p.startsWith(`${prefix}/`),
      );
      if (isPublic) return p;

      const isOld = OLD_ENDPOINTS.some(
        (prefix) => p === prefix || p.startsWith(`${prefix}/`),
      );
      if (isOld) return p;

      const segments = p.split("/").filter(Boolean);
      if (segments.length >= 2) {
        return `/${segments.slice(1).join("/")}`;
      }
      return p;
    };

    const effectivePath = normalizeDashboardPath(pathname);

    const isDashboardPage = effectivePath?.startsWith("/dashboard") || (isDashboardHost && pathname === "/")
    const isDashboardSettingsPage = effectivePath === "/settings" || effectivePath?.startsWith("/settings/")
    // ... all other checks ...
    const isSchedulePage = effectivePath === "/schedule"
    const isReviewPage = effectivePath === "/review"
    const isEditorPage = effectivePath === "/editor"
    const isPostsPage = effectivePath?.startsWith("/posts")
    const isPostsSettingsPage = effectivePath === "/posts/settings"
    const isMyBlogsPage = effectivePath === "/my-blogs"
    const isDraftPage = effectivePath === "/draft" || effectivePath === "/posts/draft"
    const isTrashPage = effectivePath === "/trash"
    const isPublished = effectivePath === "/published"
    const isUnpublishedPage = effectivePath === "/unpublished"
    const isMembersPage = effectivePath === "/members"
    const isAuthorReview = effectivePath === "/author-review"
    const isViewSitePage = effectivePath?.startsWith("/view-site")
    const isCreatePublicationPage = effectivePath === "/create-publication"
    const isDomain = effectivePath === "/domain"
    const isprofilesettings = effectivePath === "/profile-settings"
    const isHome = effectivePath === "/home"
    const ismembers = effectivePath === "/posts/members"
    const isMembersDashboard = effectivePath === "/dashboard/members"
    const isPreview = effectivePath?.startsWith("/home/preview")
    const isLandingPage = effectivePath === "/" && !isDashboardHost
    const isblog = effectivePath === "/posts/my-blogs"
    const ispostsmembers = effectivePath === "/posts/home"
    const ispostspublished = effectivePath === "/posts/published"
    const islogin = effectivePath === "/login"
    const issignup = effectivePath === "/signup"
    const isforgot = effectivePath === "/forgot-password"
    const isreset = effectivePath === "/reset-password"
    const ismagiclink = effectivePath === "/magic-link"
    const iseditordashboard = effectivePath === "/editorpage"
    const isviewsite = effectivePath === "/view-site"
    const isviewblog = effectivePath?.startsWith("/view-site/blog")

    const customLayout = isPublicationSubdomain || isDashboardPage || isDashboardSettingsPage || isSchedulePage || isReviewPage || isEditorPage || isPostsPage || isMyBlogsPage || isPublished || isDraftPage || isTrashPage || isUnpublishedPage || isCreatePublicationPage || isprofilesettings || isHome || isPostsSettingsPage || isAuthorReview || isMembersPage || isViewSitePage || ismembers || isMembersDashboard || isDomain || isPreview || isblog || ispostsmembers || ispostspublished || islogin || issignup || isforgot || isreset || ismagiclink || iseditordashboard

    const showButtons = !isCreatePublicationPage && !isPreview && !isDashboardPage && !isDashboardSettingsPage && !isprofilesettings && !isPostsSettingsPage && !isEditorPage && !islogin && !issignup && !isforgot && !isreset && !ismagiclink

    return {
      useCustomLayout: customLayout,
      showMobileButtons: showButtons,
      isLandingPage: isLandingPage
    }
  }, [pathname, isDashboardHost])

  if (useCustomLayout) {
    return (
      <div className="min-h-screen">
        <div className="page-transition">
          {children}
        </div>
        {showMobileButtons && (
          <>
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
        <div className="page-transition">
          {children}
        </div>
      </main>
      <Footer />
      {!isLandingPage && (
        <>
          <FeedbackButton />
        </>
      )}
    </>
  )
}
