'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="hidden lg:flex fixed bottom-4 right-4 md:bottom-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-gray-200 rounded-full items-center justify-center transition-all z-50 shadow-lg"
          aria-label="Scroll to top"
        >
          <Image 
            src="/svg/arrow-right.svg" 
            alt="Scroll to top"
            width={16}
            height={16}
            className="text-gray-200 -rotate-90 md:w-5 md:h-5"
          />
        </button>
      )}
    </>
  );
}
