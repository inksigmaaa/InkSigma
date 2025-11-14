'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import LinkIcon from '../icons/LinkIcon';
import CameraIcon from '../icons/CameraIcon';

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

      {/* Desktop Dropdown Menu */}
      {isOpen && (
        <div className="hidden md:block absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
          {/* Share to WhatsApp */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnWhatsApp();
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Image 
              src="/svg/whatsapp.svg" 
              alt="WhatsApp"
              width={28}
              height={28}
            />
            <span className="text-base text-gray-800">Share to whatsapp</span>
          </button>

          {/* Share to LinkedIn */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnLinkedIn();
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Image 
              src="/svg/linkedin.svg" 
              alt="LinkedIn"
              width={28}
              height={28}
            />
            <span className="text-base text-gray-800">Share to LinkedIn</span>
          </button>

          {/* Share to Facebook */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnFacebook();
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Image 
              src="/svg/facebook.svg" 
              alt="Facebook"
              width={28}
              height={28}
            />
            <span className="text-base text-gray-800">Share to Facebook</span>
          </button>

          {/* Share to Twitter */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnTwitter();
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Image 
              src="/svg/x-twitter.svg" 
              alt="Twitter"
              width={28}
              height={28}
            />
            <span className="text-base text-gray-800">Share to Twitter</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              copyLink();
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-base text-gray-800">
              {showCopied ? 'Link Copied!' : 'Copy Link'}
            </span>
          </button>

          {/* Save Snapshot */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-7 h-7" viewBox="0 0 32 32" fill="currentColor">
              {/* Top-left corner bracket */}
              <path d="M4 10V6C4 4.89543 4.89543 4 6 4H10V6H6V10H4Z" />
              {/* Top-right corner bracket */}
              <path d="M28 10V6V4H26H22V6H26V10H28Z" />
              {/* Bottom-left corner bracket */}
              <path d="M4 22V26V28H6H10V26H6V22H4Z" />
              {/* Bottom-right corner bracket */}
              <path d="M28 22V26H26H22V28H26C27.1046 28 28 27.1046 28 26V22H28Z" />
              {/* Document/page in center with folded corner */}
              <path d="M11 10C11 9.44772 11.4477 9 12 9H18V12H21V22C21 22.5523 20.5523 23 20 23H12C11.4477 23 11 22.5523 11 22V10Z" />
              <path d="M18 9L21 12H18V9Z" />
            </svg>
            <span className="text-base text-gray-800">Save Snapshot</span>
          </button>
        </div>
      )}

      {/* Mobile Modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            {/* Social Media Icons Row */}
            <div className="flex justify-center gap-3 mb-6">
              {/* Twitter/X */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnTwitter();
                }}
                className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
                aria-label="Share on Twitter"
              >
                <Image 
                  src="/svg/x-twitter.svg" 
                  alt="Twitter"
                  width={32}
                  height={32}
                />
              </button>

              {/* WhatsApp */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnWhatsApp();
                }}
                className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
                aria-label="Share on WhatsApp"
              >
                <Image 
                  src="/svg/whatsapp.svg" 
                  alt="WhatsApp"
                  width={32}
                  height={32}
                />
              </button>

              {/* Facebook */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnFacebook();
                }}
                className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
                aria-label="Share on Facebook"
              >
                <Image 
                  src="/svg/facebook.svg" 
                  alt="Facebook"
                  width={32}
                  height={32}
                />
              </button>

              {/* LinkedIn */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnLinkedIn();
                }}
                className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Image 
                  src="/svg/linkedin.svg" 
                  alt="LinkedIn"
                  width={32}
                  height={32}
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
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span className="text-base font-medium text-black">
                  {showCopied ? 'Copied!' : 'Copy link'}
                </span>
              </button>

              {/* Snapshot Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M4 10V6C4 4.89543 4.89543 4 6 4H10V6H6V10H4Z" />
                  <path d="M28 10V6V4H26H22V6H26V10H28Z" />
                  <path d="M4 22V26V28H6H10V26H6V22H4Z" />
                  <path d="M28 22V26H26H22V28H26C27.1046 28 28 27.1046 28 26V22H28Z" />
                  <path d="M11 10C11 9.44772 11.4477 9 12 9H18V12H21V22C21 22.5523 20.5523 23 20 23H12C11.4477 23 11 22.5523 11 22V10Z" />
                  <path d="M18 9L21 12H18V9Z" />
                </svg>
                <span className="text-base font-medium text-black">Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
