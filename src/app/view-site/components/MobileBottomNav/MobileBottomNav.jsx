'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import CopyIcon from '../icons/CopyIcon';
import ShareIcon from '../icons/ShareIcon';
import ArrowUpIcon from '../icons/ArrowUpIcon';
import CloseIcon from '../icons/CloseIcon';

export default function MobileBottomNav({ title, url, slug, description, sections = [] }) {
  const [showTOC, setShowTOC] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isSharing = useRef(false);

  const blogUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '');
  const shareText = description ? `${title} - ${description}` : title;

  // Handle scroll to show/hide bottom nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(blogUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
      setShowTOC(false);
    }
  };

  const handleShare = async () => {
    // Prevent multiple simultaneous share calls
    if (isSharing.current) {
      return;
    }

    // Check if Web Share API is supported and in secure context
    const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:');
    const canShare = typeof navigator !== 'undefined' && navigator.share && isSecureContext;

    if (canShare) {
      try {
        isSharing.current = true;
        await navigator.share({
          title: title,
          text: shareText,
          url: blogUrl,
        });
      } catch (err) {
        // User cancelled the share or an error occurred
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          // Fallback to showing custom share menu
          setShowShareMenu(true);
        }
      } finally {
        isSharing.current = false;
      }
    } else {
      // Fallback for browsers that don't support Web Share API or not in secure context
      setShowShareMenu(true);
    }
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + blogUrl)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareMenu(false);
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`;
    window.open(linkedinUrl, '_blank');
    setShowShareMenu(false);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`;
    window.open(facebookUrl, '_blank');
    setShowShareMenu(false);
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(blogUrl)}`;
    window.open(twitterUrl, '_blank');
    setShowShareMenu(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 divide-x divide-gray-200">
          {/* Copy Link Button */}
          <button
            onClick={copyLink}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-700 my-3 flex-1"
            aria-label="Copy link"
          >
            <CopyIcon />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-700 my-3 flex-1"
            aria-label="Share"
          >
            <ShareIcon />
          </button>

          {/* Table of Contents Button */}
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="flex items-center justify-center text-gray-600 hover:text-gray-900 my-3 flex-1 px-2"
            aria-label="Table of Contents"
          >
            <span className="text-sm font-normal whitespace-nowrap">Table of Content</span>
          </button>

          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-700 my-3 flex-1"
            aria-label="Scroll to top"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>

      {/* Table of Contents Modal */}
      {showTOC && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4" onClick={() => setShowTOC(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-xl font-bold text-black">Table of Contents</h3>
              <button
                onClick={() => setShowTOC(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <CloseIcon width={28} height={28} />
              </button>
            </div>
            
            {/* Content */}
            <nav className="px-6 py-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {sections.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className="text-left text-base leading-relaxed text-gray-600 hover:text-black transition-colors w-full py-4 font-medium"
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-center py-12">No sections available</p>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowShareMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">Share</h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="px-6 py-6 grid grid-cols-4 gap-6">
              {/* WhatsApp */}
              <button
                onClick={shareOnWhatsApp}
                className="flex flex-col items-center gap-2"
                aria-label="Share on WhatsApp"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image 
                    src="/svg/whatsapp.svg" 
                    alt="WhatsApp"
                    width={40}
                    height={40}
                  />
                </div>
                <span className="text-xs text-gray-600">WhatsApp</span>
              </button>

              {/* Twitter */}
              <button
                onClick={shareOnTwitter}
                className="flex flex-col items-center gap-2"
                aria-label="Share on Twitter"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image 
                    src="/svg/x-twitter.svg" 
                    alt="Twitter"
                    width={40}
                    height={40}
                  />
                </div>
                <span className="text-xs text-gray-600">Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={shareOnLinkedIn}
                className="flex flex-col items-center gap-2"
                aria-label="Share on LinkedIn"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image 
                    src="/svg/linkedin.svg" 
                    alt="LinkedIn"
                    width={40}
                    height={40}
                  />
                </div>
                <span className="text-xs text-gray-600">LinkedIn</span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareOnFacebook}
                className="flex flex-col items-center gap-2"
                aria-label="Share on Facebook"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image 
                    src="/svg/facebook.svg" 
                    alt="Facebook"
                    width={40}
                    height={40}
                  />
                </div>
                <span className="text-xs text-gray-600">Facebook</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
