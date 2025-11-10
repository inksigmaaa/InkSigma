'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ShareMenu({ title, url, slug }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const blogUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(blogUrl);
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + blogUrl)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`;
    window.open(linkedinUrl, '_blank');
    setIsOpen(false);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`;
    window.open(facebookUrl, '_blank');
    setIsOpen(false);
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(blogUrl)}`;
    window.open(twitterUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Share Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-12 h-12 bg-white/90 hover:bg-gray rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
        aria-label="Share blog"
      >
        <Image 
          src="/svg/blog_share.svg" 
          alt="Share"
          width={20}
          height={20}
        />
      </button>

      {/* Share Menu Popup */}
      {isOpen && (
        <div className="absolute top-16 right-0 bg-white rounded-3xl shadow-2xl py-8 px-8 w-80 z-50 animate-fadeIn">
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="absolute top- right-5 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <span className="text-gray-600 text-xl font-light algin-center">×</span>
          </button>

          <div className="space-y-8">
            {/* Copy Link */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyLink();
              }}
              className="w-full flex items-center gap-6 hover:opacity-70 transition-opacity text-left"
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M27.088 20.912a8.736 8.736 0 00-12.352 0l-6.178 6.176a8.734 8.734 0 1012.354 12.354L24 36.354" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
                <path d="M20.912 27.088a8.736 8.736 0 0012.352 0l6.178-6.176a8.734 8.734 0 10-12.354-12.354L24 11.646" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <span className="text-xl font-normal text-black">
                {showCopied ? 'Link Copied!' : 'Copy Link'}
              </span>
            </button>

            {/* Share to WhatsApp */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnWhatsApp();
              }}
              className="w-full flex items-center gap-6 hover:opacity-70 transition-opacity text-left"
            >
              <Image 
                src="/svg/whatsapp.svg" 
                alt="WhatsApp"
                width={48}
                height={48}
              />
              <span className="text-xl font-normal text-black">Share to whatsapp</span>
            </button>

            {/* Share to LinkedIn */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnLinkedIn();
              }}
              className="w-full flex items-center gap-6 hover:opacity-70 transition-opacity text-left"
            >
              <Image 
                src="/svg/linkedin.svg" 
                alt="LinkedIn"
                width={48}
                height={48}
              />
              <span className="text-xl font-normal text-black">Share to LinkedIn</span>
            </button>

            {/* Share to Facebook */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnFacebook();
              }}
              className="w-full flex items-center gap-6 hover:opacity-70 transition-opacity text-left"
            >
              <Image 
                src="/svg/facebook.svg" 
                alt="Facebook"
                width={48}
                height={48}
              />
              <span className="text-xl font-normal text-black">Share to Facebook</span>
            </button>

            {/* Share to Twitter */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnTwitter();
              }}
              className="w-full flex items-center gap-6 hover:opacity-70 transition-opacity text-left"
            >
              <Image 
                src="/svg/x-twitter.svg" 
                alt="Twitter"
                width={48}
                height={48}
              />
              <span className="text-xl font-normal text-black">Share to Twitter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
