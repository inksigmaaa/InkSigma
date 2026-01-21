'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { usePublication } from '@/contexts/PublicationContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentPublication, loading } = usePublication();

  // Route mapping for navigation
  const getRoute = (label) => {
    const routes = {
      "Home": "/editorpage",
      "Members": "/members",
      "Published": "/published",
      "Unpublished": "/unpublished",
      "Review": "/review",
      "My Blogs": "/my-blogs",
      "Draft": "/draft",
      "Trash": "/trash",
    };
    
    let route = routes[label] || "/dashboard";
    
    // Append publication ID to all publication-specific routes to preserve context
    if (currentPublication?.id && route !== "/dashboard" && route !== "/404") {
      route = `${route}?pub=${currentPublication.id}`;
    }
    
    return route;
  };

  // Check if the current route is active
  const isActive = (label) => {
    const route = getRoute(label);
    const basePath = route.split('?')[0];
    return pathname === basePath;
  };

  return (
    <>
      {/* SIDE CONTAINER / WRAPPER */}
      <div
        className="fixed left-1/2 -translate-x-1/2 top-[112px] w-full max-w-[1034px] h-[612px] bg-transparent z-30 px-5 pointer-events-none max-md:fixed max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:w-full max-md:max-w-full max-md:h-[70px] max-md:p-0 max-md:z-50 max-md:bg-white max-md:border-t max-md:border-gray-200 max-md:shadow-[0_-4px_12px_rgba(0,0,0,0.08)] max-md:overflow-x-auto max-md:overflow-y-hidden"
      >

        {/* SIDEBAR CONTAINER */}
        <div
          className="relative w-[165px] h-[612px] bg-white border-r border-gray-200 p-[14px] pr-[10px] flex flex-col gap-[10px] overflow-hidden pointer-events-auto max-md:w-auto max-md:min-w-max max-md:h-[70px] max-md:px-4 max-md:py-2 max-md:flex-row max-md:gap-2 max-md:border-r-0 max-md:overflow-visible "
        >

          {/* PROFILE */}
          <div
            className="flex items-center gap-2 pb-[10px] max-md:hidden"
          >
            <div className="w-[34px] h-[34px] rounded-full overflow-hidden border-2 border-violet-500 flex-shrink-0 bg-gray-100 flex items-center justify-center">
              {loading ? (
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              ) : currentPublication?.logoUrl ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${currentPublication.logoUrl}`}
                  alt={currentPublication.name || "Publication"}
                  className="w-full h-full object-cover"
                />
              ) : currentPublication?.name ? (
                <span className="text-violet-600 font-bold text-sm">
                  {currentPublication.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <img
                  src="/images/icons/profileuser.svg"
                  alt="profileImg"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <a 
                href={currentPublication?.id ? `/view-site?publicationId=${currentPublication.id}` : "/view-site"} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <button
                  className="w-[94px] h-[32px] text-white px-[16px] py-[8px] rounded-[4px] text-[14px] font-semibold leading-[100%] whitespace-nowrap hover:opacity-90 transition-opacity flex items-center justify-center bg-gradient-to-br from-[#A941FB] to-[#7864F0] shadow-[0px_4px_8px_0px_#EADBF9]"
                >
                  View Site
                </button>
              </a>
            </div>
          </div>

          {/* MY SPACE */}
          <div className="pb-2 max-md:pb-0 max-md:border-none max-md:flex-shrink-0">
            {(() => {
              const [isHovered, setIsHovered] = useState(false);
              return (
            <div
              className={`flex items-center gap-2 px-2 py-[5px] rounded-md cursor-pointer max-md:flex-col max-md:py-1 max-md:px-3 max-md:gap-1 ${isHovered ? 'bg-[#F6F6F6]' : ''}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <img src="/images/icons/myspace.svg" className={`w-6 h-6 max-md:w-6 max-md:h-6 transition-all ${pathname === '/dashboard' ? 'brightness-0' : isHovered ? 'brightness-50' : ''}`} />
              <Link href="/dashboard">
                <p className={`font-sans text-[14px] leading-[150%] m-0 max-md:text-[11px] max-md:text-center font-[\'Public Sans\'] tracking-[0%] font-normal ${pathname === '/dashboard' ? 'font-bold text-black' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                  My Space
                </p>
              </Link>
            </div>
              );
            })()}
          </div>

          {/* SECTION BLOCK COMPONENT */}
          {[
            {
              title: "PUBLICATION",
              items: [
                ["home.svg", "Home", "/editorpage"],
                ["Member.svg", "Members", "/members"],
              ]
            },
            {
              title: "ARTICLES",
              items: [
                ["Publish.svg", "Published"],
                ["unpublished.svg", "Unpublished"],
                ["Review.svg", "Review"],
              ]
            },
            {
              title: "PERSONAL",
              items: [
                ["myblogs.svg", "My Blogs", "/my blogs"],
                ["Draft.svg", "Draft", "/drafts"],
                ["trash.svg", "Trash", "/trash"],
              ]
            }
          ].map((section, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0"
            >
              {/* SECTION HEADING */}
              <h1
                className="text-[11px] font-semibold text-[#A4A4A4] tracking-[0.5px] uppercase mb-[3px] max-md:hidden"
              >
                {section.title}
              </h1>

              {/* SECTION ITEMS */}
              {section.items.map(([icon, label]) => {
                const [isHovered, setIsHovered] = useState(false);
                return (
                <Link key={label} href={getRoute(label)}>
                  <div
                    className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered && !isActive(label) ? 'bg-[#F6F6F6]' : ''}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                      <img
                        src={label === "Settings" ? `/icons/${icon}` : `/images/icons/${icon}`}
                        className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive(label) ? 'opacity-100 brightness-0' : isHovered ? 'opacity-100 brightness-50' : 'opacity-60'}`}
                      />
                      <p
                        className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-[\'Public Sans\'] leading-[150%] tracking-[0%] font-normal ${isActive(label) ? 'font-semibold text-[#2E2E2E]' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
