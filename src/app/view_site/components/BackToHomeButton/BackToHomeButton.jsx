import Link from 'next/link';
import Image from 'next/image';

export default function BackToHomeButton() {
  return (
    <div className="sticky mbky top-28 mb-8">
      <Link
        href="/view_site"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        <Image
          src="/svg/arrow-right.svg"
          alt="Back"
          width={16}
          height={16}
          className="rotate-180"
        />
        <span>Go to homepage</span>
      </Link>
    </div>
  );
}
