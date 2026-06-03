'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { redirectToDashboardEditor } from "@/utils/publicSiteAuth";

export default function ViewSiteHeader({
  userName,
  userAvatar = null,
  shareButton = null,
  publicationId = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    // Navigate directly to view-site instead of using router.back()
    // which may go back to the editor. Prefer the publicationId passed from the
    // blog (the page URL may not carry it), falling back to the query string.
    const pubId =
      publicationId ||
      searchParams.get("publicationId") ||
      searchParams.get("pub");
    router.push(pubId ? `/view-site?publicationId=${pubId}` : "/view-site");
  };

  // Improved handleBack to be more robust
  const onLogoClick = () => {
    handleBack();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100 h-[82px] flex items-center max-md:h-[68px]">
      <div className="w-[90%] lg:w-[70%] max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left Side: Logo, Name, Share */}
        <div className="flex items-center gap-4">
          <div onClick={onLogoClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <Avatar className="w-10 h-10 bg-gray-100 flex-shrink-0 relative max-md:w-7 max-md:h-7">
              {userAvatar && (
                <AvatarImage
                  src={userAvatar}
                  alt={userName || "Blog"}
                  className="w-full h-full object-cover"
                />
              )}
              <AvatarFallback className="w-full h-full bg-[#FFE8C5] text-[#845F2E] font-bold text-lg">
                {(userName || "B")?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-base font-semibold leading-none tracking-normal text-[#000000] max-md:text-sm">
              {userName || 'InkSigma'}
            </h1>
          </div>

          {/* Share Button Slot */}
          {/* {shareButton && (
            <div className="ml-2">
              {shareButton}
            </div>
          )} */}
        </div>

        {/* Right Side: Start Writing CTA */}
        <div>
          <button
            type="button"
            onClick={() => redirectToDashboardEditor({ publicationId })}
            className="bg-[#080808] text-[#EDEDED] text-sm font-medium leading-normal tracking-normal px-6 py-2 rounded-sm max-md:text-[10px] max-md:px-4 max-md:py-1.5"
          >
            Start Writing
          </button>
        </div>
      </div>
    </header>
  );
}
