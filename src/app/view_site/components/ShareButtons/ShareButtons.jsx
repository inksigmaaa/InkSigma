'use client';

import Image from 'next/image';

export default function ShareButtons({ title, url, slug, description }) {
  const blogUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '');
  const shareText = description ? `${title} - ${description}` : title;

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + blogUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`;
    window.open(linkedinUrl, '_blank');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(blogUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="fixed  flex flex-col gap-2 z-50 pt-20 px-10">
      {/* Share to WhatsApp */}
      <button
        onClick={shareOnWhatsApp}
        className="w-12 h-12 flex items-center justify-center"
        aria-label="Share on WhatsApp"
      >
        <Image 
          src="/svg/whatsapp.svg" 
          alt="WhatsApp"
          width={40}
          height={40}
        />
      </button>

      {/* Share to Twitter */}
      <button
        onClick={shareOnTwitter}
        className="w-12 h-12 flex items-center justify-center"
        aria-label="Share on Twitter"
      >
        <Image 
          src="/svg/x-twitter.svg" 
          alt="Twitter"
          width={40}
          height={40}
        />
      </button>

      {/* Share to LinkedIn */}
      <button
        onClick={shareOnLinkedIn}
        className="w-12 h-12 flex items-center justify-center"
        aria-label="Share on LinkedIn"
      >
        <Image 
          src="/svg/linkedin.svg" 
          alt="LinkedIn"
          width={40}
          height={40}
        />
      </button>

      {/* Share to Facebook */}
      <button
        onClick={shareOnFacebook}
        className="w-12 h-12 flex items-center justify-center"
        aria-label="Share on Facebook"
      >
        <Image 
          src="/svg/facebook.svg" 
          alt="Facebook"
          width={40}
          height={40}
        />
      </button>
    </div>
  );
}
