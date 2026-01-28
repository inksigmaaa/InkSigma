'use client';

import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function ShareButtons({ title, url, slug, description, blogId }) {
  const blogUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '');
  const shareText = description ? `${title} - ${description}` : title;

  // Track share action
  const trackShare = async (platform) => {
    if (!blogId) return;
    
    try {
      await fetch(`${API_URL}/api/views/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, platform }),
      });
      console.log(`[ShareButtons] Tracked ${platform} share for blog ${blogId}`);
    } catch (error) {
      console.error(`[ShareButtons] Failed to track ${platform} share:`, error);
    }
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + blogUrl)}`;
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
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(blogUrl)}`;
    window.open(twitterUrl, '_blank');
    trackShare('twitter');
  };

  return (
    <div className="sticky top-24 flex flex-col gap-2 z-10 pt-4">
      {/* Share to WhatsApp */}
      <button
        onClick={shareOnWhatsApp}
        className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Share on WhatsApp"
      >
        <Image 
          src="/svg/whatsapp.svg" 
          alt="WhatsApp"
          width={34}
          height={34}
        />
      </button>

      {/* Share to Twitter */}
      <button
        onClick={shareOnTwitter}
        className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Share on Twitter"
      >
        <Image 
          src="/svg/x-twitter.svg" 
          alt="Twitter"
          width={34}
          height={34}
        />
      </button>

      {/* Share to LinkedIn */}
      <button
        onClick={shareOnLinkedIn}
        className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Share on LinkedIn"
      >
        <Image 
          src="/svg/linkedin.svg" 
          alt="LinkedIn"
          width={34}
          height={34}
        />
      </button>

      {/* Share to Facebook */}
      <button
        onClick={shareOnFacebook}
        className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Share on Facebook"
      >
        <Image 
          src="/svg/facebook.svg" 
          alt="Facebook"
          width={34}
          height={34}
        />
      </button>
    </div>
  );
}
