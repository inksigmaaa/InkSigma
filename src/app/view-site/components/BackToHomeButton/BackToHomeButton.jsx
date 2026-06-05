'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getBlogIndexPath } from "@/utils/blogUrl";

export default function BackToHomeButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (e) => {
    e.preventDefault();
    // Navigate directly to view-site instead of using router.back()
    // which may go back to the editor
    const pubId = searchParams.get("publicationId") || searchParams.get("pub");
    router.push(getBlogIndexPath(undefined, pubId));
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
