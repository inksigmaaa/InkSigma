"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePublication } from "@/contexts/PublicationContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublicationLogoUrl } from "@/utils/imageUrl";
import { useOutsideClick } from "@/hooks/useOutsideClick";

export default function PublicationSwitcher() {
  const router = useRouter();
  const { userPublications, currentPublication, switchPublication } =
    usePublication();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false), isOpen);

  const handlePublicationSwitch = (publication) => {
    switchPublication(publication);
    setIsOpen(false);

    // Preserve the current endpoint, but swap the publication prefix:
    // /oldPub/posts/home -> /newPub/posts/home
    // /home             -> /newPub/home
    const currentPath = window.location.pathname || "/";
    const currentSearch = window.location.search || ""; // Preserve query params like ?refresh=true

    // Split path into segments
    const segments = currentPath.split("/").filter(Boolean);

    const PUBLIC_PATH_PREFIXES = [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      "/auth-callback",
      "/create-publication",
      "/invite",
      "/view-site",
    ];

    const DASHBOARD_ENDPOINT_PREFIXES = [
      "/home",
      "/allArticle",
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
      "/profile-settings",
      "/domain",
      "/settings",
      "/comments",
      "/dashboard",
    ];

    const isPublicPath = (p) =>
      PUBLIC_PATH_PREFIXES.some(
        (prefix) => p === prefix || p.startsWith(`${prefix}/`),
      );

    // Check if path starts with any dashboard endpoint (after potential subdomain)
    const isOldEndpoint = (p) =>
      DASHBOARD_ENDPOINT_PREFIXES.some(
        (prefix) => p === prefix || p.startsWith(`${prefix}/`),
      );

    // Determine segments to keep
    let endpointSegments = segments;

    if (!isPublicPath(currentPath) && !isOldEndpoint(currentPath)) {
      // We are likely in a subdomain-prefixed path like /oldPub/some/page
      // We assume the first segment is the subdomain if we have at least 2 segments
      // OR if the first segment matches the *old* publication subdomain (if we knew it), but here we just rely on structure.

      // If segments.length >= 2, we assume first is subdomain
      if (segments.length >= 2) {
        endpointSegments = segments.slice(1);
      } else if (segments.length === 1) {
        // Edge case: /oldPub -> /newPub (redirects to home usually)
        // We can treat this as replacing the whole path with just the new subdomain
        endpointSegments = [];
      }
    }

    const endpointPath = endpointSegments.length
      ? `/${endpointSegments.join("/")}`
      : "/home";
    // Use router.push for client-side navigation
    router.push(`/${publication.subdomain}${endpointPath}${currentSearch}`);
  };

  const handleViewMySpace = () => {
    setIsOpen(false);
    // Use router.push for client-side navigation
    router.push("/");
  };

  if (!currentPublication) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Avatar className="w-6 h-6 bg-violet-100">
          <AvatarImage
            src={getPublicationLogoUrl(currentPublication.logoUrl)}
            alt={currentPublication.name}
            className="w-full h-full object-cover"
          />
          <AvatarFallback className="w-full h-full bg-violet-100 text-violet-600 font-semibold text-xs">
            {currentPublication.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-900 max-w-[150px] truncate">
          {currentPublication.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1">
              Switch Publication
            </div>

            <div className="max-h-60 overflow-y-auto">
              {userPublications.map((pub) => (
                <button
                  key={pub.id}
                  onClick={() => handlePublicationSwitch(pub)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                    currentPublication.id === pub.id
                      ? "bg-violet-50 border border-violet-200"
                      : ""
                  }`}
                >
                  <Avatar className="w-8 h-8 bg-gray-100 flex-shrink-0">
                    <AvatarImage
                      src={getPublicationLogoUrl(pub.logoUrl)}
                      alt={pub.name}
                      className="w-full h-full object-cover"
                    />
                    <AvatarFallback className="w-full h-full bg-gray-100 text-gray-600 font-semibold text-sm">
                      {pub.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {pub.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          pub.isOwner
                            ? "bg-blue-100 text-blue-800"
                            : pub.role === "editor"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {pub.isOwner
                          ? "Owner"
                          : pub.role.charAt(0).toUpperCase() +
                            pub.role.slice(1)}
                      </span>
                      {currentPublication.id === pub.id && (
                        <span className="text-violet-600 text-xs">Current</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={handleViewMySpace}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                View My Space
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
