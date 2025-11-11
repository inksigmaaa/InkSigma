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
        className="w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-gray rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
        aria-label="Share blog"
      >
        <Image 
          src="/svg/blog_share.svg" 
          alt="Share"
          width={18}
          height={18}
          className="md:w-5 md:h-5"
        />
      </button>

      {/* Backdrop Blur Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu Popup */}
          <div className="fixed md:absolute top-1/2 left-1/2 md:top-16 md:left-auto md:right-0 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 bg-white rounded-3xl shadow-2xl py-8 px-8 w-[90vw] max-w-[500px] md:w-[480px] z-50 animate-fadeIn">
          {/* Social Media Icons Row */}
          <div className="flex justify-center gap-3 mb-6">
            {/* Twitter/X */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnTwitter();
              }}
              className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
              aria-label="Share on Twitter"
            >
              <Image 
                src="/svg/x-twitter.svg" 
                alt="Twitter"
                width={24}
                height={24}
              />
            </button>

            {/* WhatsApp */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnWhatsApp();
              }}
              className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
              aria-label="Share on WhatsApp"
            >
              <Image 
                src="/svg/whatsapp.svg" 
                alt="WhatsApp"
                width={24}
                height={24}
              />
            </button>

            {/* Facebook */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnFacebook();
              }}
              className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
              aria-label="Share on Facebook"
            >
              <Image 
                src="/svg/facebook.svg" 
                alt="Facebook"
                width={24}
                height={24}
              />
            </button>

            {/* LinkedIn */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shareOnLinkedIn();
              }}
              className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
              aria-label="Share on LinkedIn"
            >
              <Image 
                src="/svg/linkedin.svg" 
                alt="LinkedIn"
                width={24}
                height={24}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Copy Link Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyLink();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M27.088 20.912a8.736 8.736 0 00-12.352 0l-6.178 6.176a8.734 8.734 0 1012.354 12.354L24 36.354" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
                <path d="M20.912 27.088a8.736 8.736 0 0012.352 0l6.178-6.176a8.734 8.734 0 10-12.354-12.354L24 11.646" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <span className="text-base font-medium text-black">
                {showCopied ? 'Link Copied!' : 'Copy link'}
              </span>
            </button>

            {/* Snapshot Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implement snapshot functionality
                setIsOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#000000" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#000000" strokeWidth="2"/>
                <path d="M9 3h6" stroke="#000000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-base font-medium text-black">Snapshot</span>
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
