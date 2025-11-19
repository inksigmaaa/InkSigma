'use client';

import { FileClock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  // Route mapping for navigation
  const getRoute = (label) => {
    const routes = {
      "Home": "/home",
      "Domain": "/domain",
      "Members": "/members",
      "Settings": "/dashboard/settings",
      "All Articles": "/posts",
      "Published": "/published",
      "Unpublished": "/unpublished",
      "Schedule": "/schedule",
      "Review": "/review",
      "My Blogs": "/my-blogs",
      "Draft": "/draft",
      "Trash": "/trash",
    };
    return routes[label] || "/dashboard";
  };

  // Check if the current route is active
  const isActive = (label) => {
    const route = getRoute(label);
    return pathname === route;
  };

  return (
    <>
      {/* SIDE CONTAINER / WRAPPER */}
      <div
        className="fixed left-1/2 -translate-x-1/2 top-[112px] w-full max-w-[1034px] h-[612px] bg-transparent z-30 px-5 pointer-events-none max-md:fixed max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:w-full max-md:max-w-full max-md:h-[70px] max-md:p-0 max-md:z-50 max-md:bg-white max-md:border-t max-md:border-gray-200 max-md:shadow-[0_-4px_12px_rgba(0,0,0,0.08)] max-md:overflow-x-auto max-md:overflow-y-hidden"
      >

        {/* SIDEBAR CONTAINER */}
        <div
          className="relative w-[165px] h-[612px] bg-white border-r border-gray-200 p-[14px] pr-[10px] flex flex-col gap-[10px] overflow-hidden pointer-events-auto max-md:w-auto max-md:min-w-max max-md:h-[70px] max-md:px-4 max-md:py-2 max-md:flex-row max-md:gap-2 max-md:border-r-0 max-md:overflow-visible"
        >

          {/* PROFILE */}
          <div
            className="flex items-center gap-2 pb-[10px] border-b border-gray-200 max-md:hidden"
          >
            <img
              src="/images/icons/profileuser.svg"
              alt="profileImg"
              className="w-[34px] h-[34px] rounded-full object-cover border-2 border-violet-500 flex-shrink-0"
            />

            <a href="/view-site" target="_blank" rel="noopener noreferrer">
              <button
                className="w-full bg-violet-500 text-white px-[16px] py-[6px] rounded-md text-[12px] font-normal leading-[150%] whitespace-nowrap hover:bg-violet-600"
              >
                view site
              </button>
            </a>
          </div>

          {/* MY SPACE */}
          <div className="pb-2 border-b border-gray-200 max-md:pb-0 max-md:border-none max-md:flex-shrink-0">
            <div
              className={`flex items-center gap-2 px-2 py-[5px] rounded-md cursor-pointer max-md:flex-col max-md:py-1 max-md:px-3 max-md:gap-1 ${pathname === '/dashboard' ? '' : 'hover:bg-gray-100'}`}
            >
              <img src="/images/icons/myspace.svg" className="w-6 h-6 max-md:w-6 max-md:h-6" />
              <Link href="/dashboard">
                <p className={`text-[14px] leading-[150%] max-md:text-[11px] max-md:text-center ${pathname === '/dashboard' ? 'font-bold text-black' : 'font-normal text-gray-700'}`}>
                  My Space
                </p>
              </Link>
            </div>
          </div>

          {/* SECTION BLOCK COMPONENT */}
          {[
            {
              title: "PUBLICATION",
              items: [
                ["home.svg", "Home", "/home"],
                ["domain.svg", "Domain", "/domain"],
                ["Member.svg", "Members", "/members"],
                ["settings.svg", "Settings", "/settings"],
              ]
            },
            {
              title: "ARTICLES",
              items: [
                ["all_articles.svg", "All Articles"],
                ["Publish.svg", "Published"],
                ["Publish.svg", "Unpublished"],
                ["Schedule.svg", "Schedule"],
                ["Review.svg", "Review"],
              ]
            },
            {
              title: "PERSONAL",
              items: [
                ["all_articles.svg", "My Blogs", "/my blogs"],
                ["Publish.svg", "Draft", "/drafts"],
                ["trash1.svg", "Trash", "/trash"],
              ]
            }
          ].map((section, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0"
            >
              {/* SECTION HEADING */}
              <h1
                className="text-[11px] font-semibold text-gray-400 tracking-[0.5px] uppercase mb-[3px] max-md:hidden"
              >
                {section.title}
              </h1>

              {/* SECTION ITEMS */}
              {section.items.map(([icon, label]) => (
                <Link key={label} href={getRoute(label)}>
                  <div
                    className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isActive(label) ? '' : 'hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                      {label === "Unpublished" ? (
                        <FileClock
                          className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 ${isActive(label) ? 'opacity-100 text-black' : 'opacity-60 text-gray-500'}`}
                        />
                      ) : (
                        <img
                          src={label === "Settings" ? `/icons/${icon}` : `/images/icons/${icon}`}
                          className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 ${isActive(label) ? 'opacity-100' : 'opacity-60'}`}
                        />
                      )}
                      <p
                        className={`text-[13px] leading-[150%] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap ${isActive(label) ? 'font-bold text-black' : 'font-normal text-gray-500'}`}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
