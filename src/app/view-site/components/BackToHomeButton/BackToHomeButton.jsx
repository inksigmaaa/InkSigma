'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function BackToHomeButton() {
  const router = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    router.back();
  };

  return (
    <div>
      <button
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
      </button>
    </div>
  );
}
