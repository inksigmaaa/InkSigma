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
          className="fixed bottom-8 right-8 w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center  transition-all z-50"
          aria-label="Scroll to top"
        >
          <Image 
            src="/svg/arrow-right.svg" 
            alt="Scroll to top"
            width={20}
            height={20}
            className="text-gray-200 -rotate-90"
          />
        </button>
      )}
    </>
  );
}
