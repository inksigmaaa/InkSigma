'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useState } from 'react';
import { usePublication } from '@/contexts/PublicationContext';

const MemberSidebarContent = memo(function MemberSidebarContent({ pathname, currentPublication }) {
  const getRoute = (label) => {
    const routes = {
      "Home": "/posts/home",
      "Members": "/posts/members",
      "Published": "/posts/published",
      "Review": "/author-review",
      "My Blogs": "/posts/my-blogs",
      "Draft": "/posts/draft",
    };
    
    let route = routes[label] || "/dashboard";
    
    // Append publication ID to preserve context
    if (currentPublication?.id && route !== "/dashboard") {
      route = `${route}?pub=${currentPublication.id}`;
    }
    
    return route;
  };

  const isActive = (label) => {
    const route = getRoute(label);
    const basePath = route.split('?')[0];
    return pathname === basePath;
  };

  return (
    <>
      {/* SIDE CONTAINER / WRAPPER */}
      <div className="fixed left-1/2 -translate-x-1/2 top-[112px] w-full max-w-[1034px] h-[612px] bg-transparent z-30 px-5 pointer-events-none max-md:fixed max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:w-full max-md:max-w-full max-md:h-[70px] max-md:p-0 max-md:z-50 max-md:bg-white max-md:border-t max-md:border-gray-200 max-md:shadow-[0_-4px_12px_rgba(0,0,0,0.08)] max-md:overflow-x-auto max-md:overflow-y-hidden">
        {/* SIDEBAR CONTAINER */}
        <div className="relative w-[165px] h-[612px] bg-white border-r border-gray-200 p-[14px] pr-[10px] flex flex-col gap-[10px] overflow-hidden pointer-events-auto max-md:w-auto max-md:min-w-max max-md:h-[70px] max-md:px-4 max-md:py-2 max-md:flex-row max-md:gap-2 max-md:border-r-0 max-md:overflow-visible max-md:justify-center">
          {/* PROFILE */}
          <div
            className="flex items-center gap-2 pb-[10px] border-b border-gray-200 max-md:hidden"
          >
            <div className="w-[34px] h-[34px] rounded-full overflow-hidden border-2 border-violet-500 flex-shrink-0 bg-gray-100 flex items-center justify-center">
              {currentPublication?.logoUrl ? (
                <img
                  src={`http://localhost:5000${currentPublication.logoUrl}`}
                  alt={currentPublication.name || "Publication"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full bg-purple-100 flex items-center justify-center"><span class="text-purple-600 font-semibold text-sm">${currentPublication?.name?.charAt(0).toUpperCase() || 'P'}</span></div>`;
                  }}
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

          {/* MY SPACE */}
          <div className="pb-2 border-b border-gray-200 max-md:pb-0 max-md:border-none max-md:flex-shrink-0">
            <div className="flex items-center gap-2 px-2 py-[5px] rounded-md cursor-pointer hover:bg-gray-100 max-md:flex-col max-md:py-1 max-md:px-3 max-md:gap-1">
              <img src="/images/icons/myspace.svg" className="w-6 h-6 max-md:w-6 max-md:h-6" />
              <Link href="/dashboard">
                <p className="font-sans font-normal text-[14px] leading-[150%] text-[#B0B0B0] max-md:text-[11px] max-md:text-center">
                  My Space
                </p>
              </Link>
            </div>
          </div>

          {/* PUBLICATION SECTION */}
          <div className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0">
            <div className="max-md:hidden">
              <h1 className="text-[11px] font-semibold text-[#A4A4A4] tracking-[0.5px] uppercase mb-[3px]">
                PUBLICATION
              </h1>
            </div>

            {/* Home */}
            {(() => {
              const [isHovered, setIsHovered] = useState(false);
              return (
              <Link href={getRoute("Home")}>
                <div 
                  className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered && !isActive('Home') ? 'bg-[#F6F6F6]' : ''}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                    <img src="/images/icons/home.svg" className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive('Home') ? 'opacity-100 brightness-0' : isHovered ? 'opacity-100 brightness-50' : 'opacity-60'}`} />
                    <p className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-[\'Public Sans\'] leading-[150%] tracking-[0%] font-normal ${isActive('Home') ? 'font-semibold text-[#2E2E2E]' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                      Home
                    </p>
                  </div>
                </div>
              </Link>
              );
            })()}

            {/* Members */}
            {(() => {
              const [isHovered, setIsHovered] = useState(false);
              return (
              <Link href={getRoute("Members")}>
                <div 
                  className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered && !isActive('Members') ? 'bg-[#F6F6F6]' : ''}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                    <img src="/images/icons/Member.svg" className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive('Members') ? 'opacity-100 brightness-0' : isHovered ? 'opacity-100 brightness-50' : 'opacity-60'}`} />
                    <p className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-[\'Public Sans\'] leading-[150%] tracking-[0%] font-normal ${isActive('Members') ? 'font-semibold text-[#2E2E2E]' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                      Members
                    </p>
                  </div>
                </div>
              </Link>
              );
            })()}
          </div>

          {/* ARTICLES SECTION */}
          <div className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0">
            <h1 className="text-[11px] font-semibold text-[#A4A4A4] tracking-[0.5px] uppercase mb-[3px] max-md:hidden">
              ARTICLES
            </h1>

            {/* Published */}
            {(() => {
              const [isHovered, setIsHovered] = useState(false);
              return (
              <Link href={getRoute("Published")}>
                <div 
                  className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered && !isActive('Published') ? 'bg-[#F6F6F6]' : ''}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                    <img src="/images/icons/Publish.svg" className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive('Published') ? 'opacity-100 brightness-0' : isHovered ? 'opacity-100 brightness-50' : 'opacity-60'}`} />
                    <p className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-[\'Public Sans\'] leading-[150%] tracking-[0%] font-normal ${isActive('Published') ? 'font-semibold text-[#2E2E2E]' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                      Published
                    </p>
                  </div>
                </div>
              </Link>
              );
            })()}

            {/* Review */}
            {(() => {
              const [isHovered, setIsHovered] = useState(false);
              return (
              <Link href={getRoute("Review")}>
                <div 
                  className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered && !isActive('Review') ? 'bg-[#F6F6F6]' : ''}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                    <img src="/images/icons/Review.svg" className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive('Review') ? 'opacity-100 brightness-0' : isHovered ? 'opacity-100 brightness-50' : 'opacity-60'}`} />
                    <p className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-[\'Public Sans\'] leading-[150%] tracking-[0%] font-normal ${isActive('Review') ? 'font-semibold text-[#2E2E2E]' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                      Review
                    </p>
                  </div>
                </div>
              </Link>
              );
            })()}
          </div>

          {/* PERSONAL SECTION */}
          <div className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0">
            <h1 className="text-[11px] font-semibold text-[#A4A4A4] tracking-[0.5px] uppercase mb-[3px] max-md:hidden">
              PERSONAL
            </h1>

            {/* My Blogs */}
            {(() => {
              const [isHovered, setIsHovered] = useState(false);
              return (
              <Link href={getRoute("My Blogs")}>
                <div 
                  className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered && !isActive('My Blogs') ? 'bg-[#F6F6F6]' : ''}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                    <img src="/images/icons/all_articles.svg" className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive('My Blogs') ? 'opacity-100 brightness-0' : isHovered ? 'opacity-100 brightness-50' : 'opacity-60'}`} />
                    <p className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-[\'Public Sans\'] leading-[150%] tracking-[0%] font-normal ${isActive('My Blogs') ? 'font-semibold text-[#2E2E2E]' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                      My Blogs
                    </p>
                  </div>
                </div>
              </Link>
              );
            })()}

            {/* Draft */}
            {(() => {
              const [isHovered, setIsHovered] = useState(false);
              return (
              <Link href={getRoute("Draft")}>
                <div 
                  className={`flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0 ${isHovered && !isActive('Draft') ? 'bg-[#F6F6F6]' : ''}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                    <img src="/images/icons/draft.svg" className={`w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6 transition-all ${isActive('Draft') ? 'opacity-100 brightness-0' : isHovered ? 'opacity-100 brightness-50' : 'opacity-60'}`} />
                    <p className={`font-sans text-[14px] m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap transition-colors font-[\'Public Sans\'] leading-[150%] tracking-[0%] font-normal ${isActive('Draft') ? 'font-semibold text-[#2E2E2E]' : isHovered ? 'text-[#2E2E2E]' : 'text-[#B0B0B0]'}`}>
                      Draft
                    </p>
                  </div>
                </div>
              </Link>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
});

export default function MemberSidebar() {
  const pathname = usePathname();
  const { currentPublication } = usePublication();
  
  return <MemberSidebarContent pathname={pathname} currentPublication={currentPublication} />;
}