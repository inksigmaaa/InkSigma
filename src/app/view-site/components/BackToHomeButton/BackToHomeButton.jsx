'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function BackToHomeButton() {
  const handleClick = () => {
    // Scroll to top when navigating back
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <Link
        href="/view-site"
        onClick={handleClick}
        className="inline-flex items-center gap-2 w-[100px] my-1 text-gray-700 text-sm hover:text-black transition-colors"
      >
        <Image
          src="/svg/arrow-right.svg"
          alt="Back"
          width={16}
          height={16}
          className="rotate-180"
        />
        <span>Go Back</span>
      </Link>
    </div>
  );
}
