'use client';

import Image from 'next/image';

export default function ViewSiteHeader({ userName = 'The Nature Blog', userAvatar = null }) {
  return (
    <header className="bg-white border-b border-gray-200 py-4 md:py-5 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Logo and Blog Name - Centered */}
        <div className="flex items-center justify-center gap-2 md:gap-3">
          {/* Logo/Avatar */}
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
            {userAvatar ? (
              <Image 
                src={userAvatar} 
                alt={userName}
                width={28}
                height={28}
                className="object-cover"
              />
            ) : (
              <Image 
                src="/svg/logo.svg" 
                alt="Logo"
                width={28}
                height={28}
                className="object-cover"
              />
            )}
          </div>
          
          {/* Blog Name */}
          <h1 className="font-semibold text-sm md:text-base text-gray-900 whitespace-nowrap">{userName}</h1>
        </div>
      </div>
    </header>
  );
}
