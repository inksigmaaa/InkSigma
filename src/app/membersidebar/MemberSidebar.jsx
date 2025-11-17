export default function MemberSidebar() {
  const getRoute = (label) => {
    const routes = {
      "Home": "/posts",
      "Members": "/posts/members",
      "Published": "/published",
      "Review": "/review",
      "My Blogs": "/my-blogs",
    };
    return routes[label] || "/dashboard";
  };

  return (
    <>
      {/* SIDE CONTAINER / WRAPPER */}
      <div
        className="
          fixed left-1/2 -translate-x-1/2 top-[112px]
          w-full max-w-[1034px] h-[612px]
          bg-transparent z-30 px-5
          pointer-events-none

          max-md:fixed max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0
          max-md:translate-x-0 max-md:w-full max-md:max-w-full max-md:h-[70px]
          max-md:p-0 max-md:z-50 max-md:bg-white 
          max-md:border-t max-md:border-gray-200 
          max-md:shadow-[0_-4px_12px_rgba(0,0,0,0.08)]
          max-md:overflow-x-auto max-md:overflow-y-hidden
        "
      >
        {/* SIDEBAR CONTAINER */}
        <div
          className="
            relative
            w-[165px] h-[612px]
            bg-white border-r border-gray-200
            p-[14px] pr-[10px]
            flex flex-col gap-[10px]
            overflow-hidden pointer-events-auto

            max-md:w-auto max-md:min-w-max max-md:h-[70px]
            max-md:px-4 max-md:py-2
            max-md:flex-row max-md:gap-2
            max-md:border-r-0 max-md:overflow-visible
          "
        >
          {/* PROFILE */}
          <div
            className="
              flex items-center justify-between gap-1 pb-[10px]
              border-b border-gray-200
              max-md:hidden
            "
          >
            <img
              src="/images/icons/profileuser.svg"
              alt="profileImg"
              className="
                w-[34px] h-[34px]
                rounded-full object-cover
                border-2 border-violet-500
                flex-shrink-0
              "
            />

            <a href="/view-site" target="_blank" rel="noopener noreferrer">
              <button
                className="
                  bg-violet-500 text-white
                  px-[10px] py-[6px]
                  rounded-md text-[12px] font-normal leading-[150%]
                  whitespace-nowrap
                  hover:bg-violet-600
                "
              >
                View Site
              </button>
            </a>
          </div>

          {/* MY SPACE */}
          <div className="pb-2 border-b border-gray-200 max-md:pb-0 max-md:border-none max-md:flex-shrink-0">
            <div
              className="
                flex items-center gap-2
                px-2 py-[5px]
                rounded-md cursor-pointer
                hover:bg-gray-100
                max-md:flex-col max-md:py-1 max-md:px-3 max-md:gap-1
              "
            >
              <img src="/images/icons/myspace.svg" className="w-6 h-6 max-md:w-6 max-md:h-6" />
              <a href="/dashboard">
                <p className="text-[14px] font-normal leading-[150%] text-gray-400 max-md:text-[11px] max-md:text-center">
                  My Space
                </p>
              </a>
            </div>
          </div>

          {/* PUBLICATION SECTION */}
          <div className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0">
            <h1 className="text-[11px] font-semibold text-gray-400 tracking-[0.5px] uppercase mb-[3px] max-md:hidden">
              PUBLICATION
            </h1>

            {/* Home */}
            <a href={getRoute("Home")}>
              <div className="flex items-center px-2 py-[5px] rounded-md cursor-pointer hover:bg-gray-100 max-md:px-3 max-md:py-1 max-md:flex-shrink-0">
                <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                  <img src="/images/icons/home.svg" className="w-5 h-5 opacity-60 flex-shrink-0 max-md:w-6 max-md:h-6" />
                  <p className="text-[13px] font-normal leading-[150%] text-gray-400 m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap">
                    Home
                  </p>
                </div>
              </div>
            </a>

            {/* Members - Active/Highlighted */}
            <a href={getRoute("Members")}>
              <div className="flex items-center px-2 py-[5px] rounded-md cursor-pointer max-md:px-3 max-md:py-1 max-md:flex-shrink-0">
                <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                  <img src="/images/icons/Member.svg" className="w-5 h-5 flex-shrink-0 max-md:w-6 max-md:h-6" />
                  <p className="text-[13px] font-semibold leading-[150%] text-gray-900 m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap">
                    Members
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* ARTICLES SECTION */}
          <div className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0">
            <h1 className="text-[11px] font-semibold text-gray-400 tracking-[0.5px] uppercase mb-[3px] max-md:hidden">
              ARTICLES
            </h1>

            {/* Published */}
            <a href={getRoute("Published")}>
              <div className="flex items-center px-2 py-[5px] rounded-md cursor-pointer hover:bg-gray-100 max-md:px-3 max-md:py-1 max-md:flex-shrink-0">
                <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                  <img src="/images/icons/Publish.svg" className="w-5 h-5 opacity-60 flex-shrink-0 max-md:w-6 max-md:h-6" />
                  <p className="text-[13px] font-normal leading-[150%] text-gray-400 m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap">
                    Published
                  </p>
                </div>
              </div>
            </a>

            {/* Review */}
            <a href={getRoute("Review")}>
              <div className="flex items-center px-2 py-[5px] rounded-md cursor-pointer hover:bg-gray-100 max-md:px-3 max-md:py-1 max-md:flex-shrink-0">
                <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                  <img src="/images/icons/Review.svg" className="w-5 h-5 opacity-60 flex-shrink-0 max-md:w-6 max-md:h-6" />
                  <p className="text-[13px] font-normal leading-[150%] text-gray-400 m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap">
                    Review
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* PERSONAL SECTION */}
          <div className="flex flex-col gap-[3px] max-md:flex-row max-md:gap-2 max-md:p-0">
            <h1 className="text-[11px] font-semibold text-gray-400 tracking-[0.5px] uppercase mb-[3px] max-md:hidden">
              PERSONAL
            </h1>

            {/* My Blogs */}
            <a href={getRoute("My Blogs")}>
              <div className="flex items-center px-2 py-[5px] rounded-md cursor-pointer hover:bg-gray-100 max-md:px-3 max-md:py-1 max-md:flex-shrink-0">
                <div className="flex items-center gap-2 w-full max-md:flex-col max-md:gap-1">
                  <img src="/images/icons/all_articles.svg" className="w-5 h-5 opacity-60 flex-shrink-0 max-md:w-6 max-md:h-6" />
                  <p className="text-[13px] font-normal leading-[150%] text-gray-400 m-0 max-md:text-[11px] max-md:text-center whitespace-nowrap">
                    My Blogs
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
