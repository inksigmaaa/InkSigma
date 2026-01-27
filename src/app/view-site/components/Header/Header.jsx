'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ViewSiteHeader({ userName, userAvatar = null, shareButton = null }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100 h-[82px] flex items-center max-md:h-[68px]">
      <div className="w-[90%] lg:w-[70%] max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left Side: Logo, Name, Share */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 relative max-md:w-7 max-md:h-7">
              {userAvatar ? (
                <img
                  src={userAvatar} 
                  alt={userName || 'Blog'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full bg-[#FFE8C5] flex items-center justify-center"><span class="text-[#845F2E] font-bold text-lg">${(userName || 'B')?.charAt(0).toUpperCase()}</span></div>`;
                  }}
                />
              ) : (
                 <div className="w-full h-full bg-[#FFE8C5] flex items-center justify-center">
                    <span className="text-[#845F2E] font-bold text-lg">
                      {(userName || 'B')?.charAt(0).toUpperCase()}
                    </span>
                  </div>
              )}
            </div>
            
            <h1 className="text-base font-semibold leading-none tracking-normal text-[#000000] max-md:text-sm">
              {userName || 'InkSigma'}
            </h1>
          </Link>

          {/* Share Button Slot */}
          {shareButton && (
            <div className="ml-2">
              {shareButton}
            </div>
          )}
        </div>

        {/* Right Side: Start Writing CTA */}
        <div>
          <Link 
            href="/editorpage" 
            className="bg-[#080808] text-[#EDEDED] text-sm font-medium leading-normal tracking-normal px-6 py-2 rounded-sm max-md:text-[10px] max-md:px-4 max-md:py-1.5"
          >
            Start Writing
          </Link>
        </div>
      </div>
    </header>
  );
}
