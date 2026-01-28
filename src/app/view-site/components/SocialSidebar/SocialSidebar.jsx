'use client';

import { useState } from 'react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function SocialSidebar({ title, url, slug, blogId, onSnapshot }) {
  const [showCopied, setShowCopied] = useState(false);

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
      console.log(`[SocialSidebar] Tracked ${platform} share for blog ${blogId}`);
    } catch (error) {
      console.error(`[SocialSidebar] Failed to track ${platform} share:`, error);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(blogUrl);
      trackShare('copy');
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + blogUrl)}`;
    window.open(whatsappUrl, '_blank');
    trackShare('whatsapp');
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`;
    window.open(linkedinUrl, '_blank');
    trackShare('linkedin');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`;
    window.open(facebookUrl, '_blank');
    trackShare('facebook');
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(blogUrl)}`;
    window.open(twitterUrl, '_blank');
    trackShare('twitter');
  };

  // Common button style
  const buttonClass = "w-8 h-8 rounded-lg flex items-center border-[1px] border-[#EAEAEA] justify-center ";

  return (
    <div className="flex flex-col gap-3 items-center sticky top-28">
      {/* Copy Link */}
      <button onClick={copyLink} className={buttonClass} aria-label="Copy Link" title="Copy Link">
        {showCopied ? (
          <span className="text-xs font-bold text-green-600">✓</span>
        ) : (
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>

      {/* WhatsApp */}
      <button onClick={shareOnWhatsApp} className={buttonClass} aria-label="Share on WhatsApp">
        <Image src="/svg/whatsapp.svg" alt="WhatsApp" width={16} height={16} />
      </button>

      {/* Facebook */}
      <button onClick={shareOnFacebook} className={buttonClass} aria-label="Share on Facebook">
        <Image src="/svg/facebook.svg" alt="Facebook" width={16} height={16} />
      </button>

      {/* Twitter */}
      <button onClick={shareOnTwitter} className={buttonClass} aria-label="Share on Twitter">
        <Image src="/svg/x-twitter.svg" alt="X (Twitter)" width={16} height={16} />
      </button>

      {/* LinkedIn */}
      <button onClick={shareOnLinkedIn} className={buttonClass} aria-label="Share on LinkedIn">
        <Image src="/svg/linkedin.svg" alt="LinkedIn" width={16} height={16} />
      </button>

      {/* Snapshot / Capture */}
      <button 
        onClick={() => onSnapshot && onSnapshot()} 
        className={buttonClass} 
        aria-label="Save Snapshot"
      >
         <Image src="/svg/save_snapshot.svg" alt="Save Snapshot" width={16} height={16} />
      </button>
    </div>
  );
}
