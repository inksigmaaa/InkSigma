'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import LinkIcon from '../icons/LinkIcon';
import CameraIcon from '../icons/CameraIcon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ShareMenu({ title, url, slug, blogId }) {
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

  // Track share action
  const trackShare = async (platform) => {
    if (!blogId) return;
    
    try {
      await fetch(`${API_URL}/api/views/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, platform }),
      });
      console.log(`[ShareMenu] Tracked ${platform} share for blog ${blogId}`);
    } catch (error) {
      console.error(`[ShareMenu] Failed to track ${platform} share:`, error);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(blogUrl);
      trackShare('copy');
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
    trackShare('whatsapp');
    setIsOpen(false);
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`;
    window.open(linkedinUrl, '_blank');
    trackShare('linkedin');
    setIsOpen(false);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`;
    window.open(facebookUrl, '_blank');
    trackShare('facebook');
    setIsOpen(false);
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(blogUrl)}`;
    window.open(twitterUrl, '_blank');
    trackShare('twitter');
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
        className="w-9 h-9 max-md:w-8 max-md:h-8 bg-[#999999]/60 text-[#FFFFFF]  rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
        aria-label="Share blog"
      >
        <Image 
          src="/svg/blog_share.svg" 
          alt="Share"
          width={16}
          height={16}
          className="md:w-4 md:h-4"
        />
      </button>

      {/* Desktop Dropdown Menu */}
      {isOpen && (
        <div className="hidden md:block absolute top-14 right-0 whitespace-nowrap pl-4 pr-8 py-2 gap-3 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
          {/* Share to WhatsApp */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnWhatsApp();
            }}
            className="w-full flex items-center gap-2 py-1 my-2.5"
          >
            <Image 
              src="/svg/whatsapp.svg" 
              alt="WhatsApp"
              width={14}
              height={14}
            />
            <span className="text-sm font-normal leading-normal tracking-normal text-[#000000]">Share to whatsapp</span>
          </button>

          {/* Share to LinkedIn */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnLinkedIn();
            }}
            className="w-full flex items-center gap-2 py-1 my-2.5"
          >
            <Image 
              src="/svg/linkedin.svg" 
              alt="LinkedIn"
              width={14}
              height={14}
            />
            <span className="text-sm font-normal leading-normal tracking-normal text-[#000000]">Share to LinkedIn</span>
          </button>

          {/* Share to Facebook */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnFacebook();
            }}
            className="w-full flex items-center gap-2 py-1 my-2.5"
          >
            <Image 
              src="/svg/facebook.svg" 
              alt="Facebook"
              width={14}
              height={14}
            />
            <span className="text-sm font-normal leading-normal tracking-normal text-[#000000]">Share to Facebook</span>
          </button>

          {/* Share to Twitter */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              shareOnTwitter();
            }}
            className="w-full flex items-center gap-2 py-1 my-2.5"
          >
            <Image 
              src="/svg/x-twitter.svg" 
              alt="Twitter"
              width={14}
              height={14}
            />
            <span className="text-sm font-normal leading-normal tracking-normal text-[#000000]">Share to Twitter</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              copyLink();
            }}
            className="w-full flex items-center gap-2 py-1 my-2.5"
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-sm font-normal leading-normal tracking-normal text-[#000000]">
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
            className="w-full flex items-center gap-2 py-1 my-2.5"
          >
            <Image 
              src="/svg/save_snapshot.svg" 
              alt="Save Snapshot"
              width={14}
              height={14}
            />
            <span className="text-sm font-normal leading-normal tracking-normal text-[#000000]">Save Snapshot</span>
          </button>
        </div>
      )}

      {/* Mobile Modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
            {/* Social Media Icons Row */}
            <div className="flex justify-around gap-3 mb-3">
              {/* Twitter/X */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnTwitter();
                }}
                className="w-8 h-8 border border-[#EAEAEA] hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Share on Twitter"
              >
                <Image 
                  src="/svg/x-twitter.svg" 
                  alt="Twitter"
                  width={16}
                  height={16}
                />
              </button>

              {/* WhatsApp */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnWhatsApp();
                }}
                className="w-8 h-8 border border-[#EAEAEA] hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Share on WhatsApp"
              >
                <Image 
                  src="/svg/whatsapp.svg" 
                  alt="WhatsApp"
                  width={16}
                  height={16}
                />
              </button>

              {/* Facebook */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnFacebook();
                }}
                className="w-8 h-8 border border-[#EAEAEA] hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Share on Facebook"
              >
                <Image 
                  src="/svg/facebook.svg" 
                  alt="Facebook"
                  width={16}
                  height={16}
                />
              </button>

              {/* LinkedIn */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  shareOnLinkedIn();
                }}
                className="w-8 h-8 border border-[#EAEAEA] hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Image 
                  src="/svg/linkedin.svg" 
                  alt="LinkedIn"
                  width={16}  
                  height={16}
                />
              </button>
            </div>

            <div className='h-[1px] w-full bg-[#F8F8F8]'></div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {/* Copy Link Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copyLink();
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-[#EAEAEA] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span className="text-xs font-semibold leading-normal tracking-normal text-[#000000]">
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
                className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-[#EAEAEA]  rounded-lg transition-colors"
              >
                <Image 
              src="/svg/save_snapshot.svg" 
              alt="Save Snapshot"
              width={16}
              height={16}
            />
                <span className="text-xs font-semibold leading-normal tracking-normal text-[#000000]">Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
