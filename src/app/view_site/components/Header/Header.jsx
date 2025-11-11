'use client';

import Image from 'next/image';

export default function ViewSiteHeader({ userName = 'The Nature Blog', userAvatar = null }) {
  return (
    <header className="bg-white border-b border-gray-200 py-4 md:py-5 px-4 md:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left Section - Logo and Blog Name */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Logo/Avatar */}
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
            {userAvatar ? (
              <Image 
                src={userAvatar} 
                alt={userName}
                width={56}
                height={56}
                className="object-cover"
              />
            ) : (
              <Image 
                src="/svg/logo.svg" 
                alt="Logo"
                width={56}
                height={56}
                className="object-cover"
              />
            )}
          </div>
          
          {/* Blog Name */}
          <h1 className="font-bold text-lg md:text-2xl text-gray-900">{userName}</h1>
        </div>

        {/* Right Section - Start Writing Button */}
        <a
          href="/write"
          className="px-5 py-2.5 md:px-6 md:py-3 bg-black text-white rounded-lg text-sm md:text-base hover:bg-gray-800 transition-colors font-medium"
        >
          Start Writing
        </a>
      </div>
    </header>
  );
}
