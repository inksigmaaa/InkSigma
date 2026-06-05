"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, memo } from "react";
import { motion } from "motion/react";
import { usePublication } from "@/contexts/PublicationContext";

// Snappy-but-smooth spring for the shared active-pill slide between nav items.
const PILL_SPRING = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };
// Single shared layoutId — only one item is active at a time, so the pill
// animates from the old item's box to the new one on every navigation.
const ACTIVE_PILL = "sidebar-active-pill";
import { getPublicationLogoUrl } from "@/utils/imageUrl";
import { hasPermission } from "@/utils/permissions";
import { getPublicationSiteHref } from "@/utils/publicationDomain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MENU_SECTIONS = [
  {
    title: "PUBLICATION",
    items: [
      { label: "Home", icon: "home.svg", check: () => true },
      {
        label: "Domain",
        icon: "domain.svg",
        check: (r) => hasPermission(r, "canAccessDomain"),
      },
      {
        label: "Members",
        icon: "Member.svg",
        check: (r) => hasPermission(r, "canAccessMembers"),
      },
      {
        label: "Settings",
        icon: "settings.svg",
        check: (r) => hasPermission(r, "canAccessSettings"),
      },
    ],
  },
  {
    title: "ARTICLES",
    items: [
      {
        label: "All Articles",
        icon: "all_articles.svg",
        check: (r) => hasPermission(r, "canAccessAllArticles"),
      },
      {
        label: "Published",
        icon: "Publish.svg",
        check: (r) => hasPermission(r, "canAccessPublished"),
      },
      {
        label: "Unpublished",
        icon: "unpublished.svg",
        check: (r) => hasPermission(r, "canAccessAllArticles"),
      },
      {
        label: "Schedule",
        icon: "Schedule.svg",
        check: (r) => hasPermission(r, "canAccessScheduled"),
      },
      {
        label: "Review",
        icon: "Review.svg",
        check: (r) => hasPermission(r, "canAccessReviewQueue"),
        getRoute: (role) =>
          role === "author" ? "/author-review" : "/review",
      },
    ],
  },
  {
    title: "PERSONAL",
    items: [
      {
        label: "My Blogs",
        icon: "myblogs.svg",
        check: (r) => hasPermission(r, "viewOwnArticles"),
      },
      {
        label: "Draft",
        icon: "draft.svg",
        check: (r) => hasPermission(r, "canAccessDrafts"),
      },
      {
        label: "Trash",
        icon: "trash.svg",
        check: (r) => hasPermission(r, "viewOwnArticles"),
      },
    ],
  },
];

// Extracted component for individual menu items to comply with Rules of Hooks
const SidebarMenuItem = memo(function SidebarMenuItem({ label, icon, route, isActive }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={route}>
      <div
        className={`relative flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 transition-colors duration-200 ${isHovered && !isActive ? "bg-[#F6F6F6]" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isActive && (
          <motion.div
            layoutId={ACTIVE_PILL}
            transition={PILL_SPRING}
            className="absolute inset-0 rounded-md bg-[#EFEFEF]"
          />
        )}
        <div className="relative z-[1] flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
          <img
            src={
              label === "Settings" ? `/icons/${icon}` : `/images/icons/${icon}`
            }
            alt=""
            className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive ? "opacity-100 brightness-0" : isHovered ? "opacity-100 brightness-50" : "opacity-60"}`}
          />
          <p
            className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-['Public Sans'] leading-[150%] tracking-[0%] font-normal ${isActive ? "font-semibold text-[#2E2E2E]" : isHovered ? "text-[#2E2E2E]" : "text-[#B0B0B0]"}`}
          >
            {label}
          </p>
        </div>
      </div>
    </Link>
  );
});

// Extracted component for My Space item
const MySpaceItem = memo(function MySpaceItem({ pathname }) {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = pathname === "/";

  return (
    <div
      className={`relative flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 transition-colors duration-200 ${isHovered && !isActive ? "bg-[#F6F6F6]" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isActive && (
        <motion.div
          layoutId={ACTIVE_PILL}
          transition={PILL_SPRING}
          className="absolute inset-0 rounded-md bg-[#EFEFEF]"
        />
      )}
      <div className="relative z-[1] flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
        <img
          src="/images/icons/myspace.svg"
          alt=""
          className={`w-6 h-6 max-md:w-6 max-md:h-6 transition-all ${isActive ? "brightness-0" : isHovered ? "brightness-50" : ""}`}
        />
        <Link href="/">
          <p
            className={`font-sans text-[14px] leading-[150%] m-0 max-md:text-[11px] max-md:text-center font-['Public Sans'] tracking-[0%] font-normal ${isActive ? "font-bold text-black" : isHovered ? "text-[#2E2E2E]" : "text-[#B0B0B0]"}`}
          >
            My Space
          </p>
        </Link>
      </div>
    </div>
  );
});

function Sidebar() {
  const pathname = usePathname();
  const { currentPublication, loading } = usePublication();
  const pubPrefix = currentPublication?.subdomain
    ? `/${currentPublication.subdomain}`
    : "";
  const publicationSiteHref = getPublicationSiteHref(currentPublication);

  const effectivePathname = (() => {
    if (!pathname) return pathname;
    if (pubPrefix && pathname.startsWith(`${pubPrefix}/`)) {
      return pathname.slice(pubPrefix.length);
    }
    return pathname;
  })();

  // Helper to determine the effective role
  const getEffectiveRole = () => {
    if (!currentPublication) return null;
    if (currentPublication.isOwner) return "admin"; // Owner is 'admin' in our permissions chart
    return currentPublication.role || "author";
  };

  const role = getEffectiveRole();

  // Route mapping for navigation
  const getRoute = (label) => {
    const routes = {
      Home: "/home",
      Domain: "/domain",
      Members: "/members",
      Settings: "/settings",
      "All Articles": "/allArticle",
      Published: "/published",
      Unpublished: "/unpublished",
      Schedule: "/schedule",
      Review: "/review",
      "My Blogs": "/my-blogs",
      Draft: "/draft",
      Trash: "/trash",
      // Add default mapping just in case, though overridden in config
      "Author Review": "/author-review",
    };

    const endpointPath = routes[label] || "/";
    // Publication-scoped routes always include /{subdomain}/...
    if (endpointPath === "/") return "/";
    return `${pubPrefix}${endpointPath}`;
  };

  // Helper to get route from item config or default map
  const getItemRoute = (item) => {
    if (item.getRoute) {
      const customRoute = item.getRoute(role);
      return `${pubPrefix}${customRoute}`;
    }
    return getRoute(item.label);
  };

  // MENU_SECTIONS is defined once at module scope (top of file) — no need to
  // rebuild this array on every render. The Review item carries a getRoute()
  // override (author -> /author-review, else /review).

  // Check if the current route is active
  const isActive = (label) => {
    // Find the item config to check for custom route logic
    let itemConfig = null;
    for (const section of MENU_SECTIONS) {
      const found = section.items.find((i) => i.label === label);
      if (found) {
        itemConfig = found;
        break;
      }
    }

    const route = itemConfig ? getItemRoute(itemConfig) : getRoute(label);
    const basePath = route.replace(pubPrefix, "").split("?")[0] || "/";
    return effectivePathname === basePath;
  };

  return (
    <>
      {/* SIDE CONTAINER / WRAPPER */}
      <div className="fixed left-1/2 -translate-x-1/2 top-[112px] w-full max-w-[1034px] h-[612px] bg-transparent z-30 px-5 pointer-events-none max-md:fixed max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:w-full max-md:max-w-full max-md:h-[70px] max-md:p-0 max-md:z-50 max-md:bg-white max-md:border-t max-md:border-gray-200 max-md:shadow-[0_-4px_12px_rgba(0,0,0,0.08)] max-md:overflow-x-auto max-md:overflow-y-hidden">
        {/* SIDEBAR CONTAINER */}
        <div className="relative w-[165px] h-[612px] bg-white border-r border-gray-200 p-[14px] pr-[10px] flex flex-col gap-[10px] overflow-hidden pointer-events-auto max-md:w-auto max-md:min-w-max max-md:h-[70px] max-md:px-4 max-md:py-2 max-md:flex-row max-md:gap-2 max-md:border-r-0 max-md:overflow-visible ">
          {/* PROFILE */}
          <div className="hidden items-center gap-2 pb-[10px] md:flex">
            <Avatar className="w-[34px] h-[34px] border-2 border-violet-500 flex-shrink-0 bg-gray-100">
              {loading && !currentPublication ? (
                <AvatarFallback className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage
                    src={getPublicationLogoUrl(currentPublication?.logoUrl)}
                    alt={currentPublication?.name || "Publication"}
                    width={34}
                    height={34}
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-cover"
                  />
                  <AvatarFallback className="w-full h-full bg-gray-100 text-violet-600 font-bold text-sm">
                    {currentPublication?.name?.charAt(0).toUpperCase() || "P"}
                  </AvatarFallback>
                </>
              )}
            </Avatar>

            <div className="flex-1 min-w-0">
              <a
                href={publicationSiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden max-md:!hidden md:inline-flex"
              >
                <button className="w-[94px] h-[32px] text-white px-[16px] py-[8px] rounded-[4px] text-[14px] font-semibold leading-[100%] whitespace-nowrap hover:opacity-90 transition-opacity flex items-center justify-center bg-gradient-to-br from-[#A941FB] to-[#7864F0] shadow-[0px_4px_8px_0px_#EADBF9]">
                  View Site
                </button>
              </a>
            </div>
          </div>

          {/* MY SPACE */}
          <div className="pb-2 max-md:pb-0 max-md:border-none max-md:flex-shrink-0">
            <MySpaceItem pathname={pathname} />
          </div>

          {/* SECTION BLOCK COMPONENT */}
          {MENU_SECTIONS.map((section, idx) => {
            // Filter items based on role permission
            const visibleItems = section.items.filter((item) =>
              item.check(role),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div
                key={idx}
                className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0"
              >
                {/* SECTION HEADING */}
                <h1 className="text-[11px] font-semibold text-[#A4A4A4] tracking-[0.5px] uppercase mb-[3px] max-md:hidden">
                  {section.title}
                </h1>

                {/* SECTION ITEMS */}
                {visibleItems.map((item) => (
                  <SidebarMenuItem
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    route={getItemRoute(item)}
                    isActive={isActive(item.label)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default memo(Sidebar);
