"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeedbackButton from "@/components/FeedbackButton";

export default function ConditionalLayout({
  children,
  isDashboardHost: isDashboardHostProp = false,
  isPublicationSubdomain: isPublicationSubdomainProp = false,
}) {
  const pathname = usePathname();
  const isDashboardHost = Boolean(isDashboardHostProp);
  const isPublicationSubdomain = Boolean(isPublicationSubdomainProp);

  // Memoize layout decision to prevent unnecessary re-evaluations
  const { useCustomLayout, showMobileButtons, isLandingPage } = useMemo(() => {
    // ALLOW LIST: Only these pages show Global Header/Footer
    const isLandingPage = pathname === "/" && !isDashboardHost;

    // Marketing Pages (Landing, Privacy, Terms)
    const isMarketingPage =
      !isDashboardHost &&
      !isPublicationSubdomain &&
      (pathname === "/" ||
        pathname.startsWith("/privacy") ||
        pathname.startsWith("/terms"));

    // Default to Custom Layout (Hidden Header/Footer) for everything else (Dashboard, Auth, App)
    const useCustomLayout = !isMarketingPage;

    // Show Mobile Feedback Button logic
    // Simplified: Don't show on Dashboard/Settings/Auth
    // Original allowed it on Landing, Privacy, etc.
    // We can just rely on the layout. If it's a marketing page, we show it (handled in return JSX).
    // If it's custom layout, we usually hide it unless it's a specific app view.
    // For safety/cleanliness, let's keep it hidden in Custom Layout for now.
    const showButtons = false;

    return {
      useCustomLayout,
      showMobileButtons: showButtons,
      isLandingPage: isLandingPage,
    };
  }, [pathname, isDashboardHost, isPublicationSubdomain]);

  if (useCustomLayout) {
    return (
      <div className="min-h-screen">
        <div className="page-transition">{children}</div>
        {showMobileButtons && (
          <>
            <FeedbackButton />
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="w-full max-w-[1920px] mx-auto bg-white">
        <div className="page-transition">{children}</div>
      </main>
      <Footer />
      {!isLandingPage && (
        <>
          <FeedbackButton />
        </>
      )}
    </>
  );
}
