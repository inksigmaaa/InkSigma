'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Footer({ publicationName = 'Jasmin blogs' }) {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const { data: session } = useSession();

  const handleStartWriting = async () => {
    // If not logged in, redirect to login
    if (!session?.user?.id) {
      router.push('/login?redirect=/editor');
      return;
    }

    // Check if user has a publication
    try {
      const response = await fetch(`${API_URL}/api/publications/user/${session.user.id}`, {
        credentials: 'include'
      });

      if (response.status === 404) {
        // No publication, redirect to create one
        router.push('/create-publication');
      } else {
        // Has publication, go to editor
        router.push('/editor');
      }
    } catch (error) {
      console.error('Error checking publication:', error);
      router.push('/editor');
    }
  };

  return (
    <footer className="w-full bg-white border-t border-gray-200 pt-10">
      <div className="flex flex-col items-center gap-4 pb-8">
        {/* Publication Name */}
        <p className="text-[#A4A4A4] text-xs font-normal leading-none tracking-normal">© {currentYear} {publicationName}</p>
        
        {/* CTA Text */}
        <p className="text-[#202020] text-sm font-semibold leading-none tracking-normal">Eager to delve into the art of blog writing?</p>
        
        {/* Start Writing Button */}
        <button 
          onClick={handleStartWriting}
          className="px-4 py-2 bg-[#202020] text-white text-sm font-medium rounded hover:bg-gray-800"
          style={{ minWidth: '118px', textAlign: 'center' }}
        >
          Start Writing
        </button>
        
        {/* Made with InkSigma */}
        <p className="text-[#A4A4A4] text-xs font-normal leading-normal">
          Made with <span className="bg-[linear-gradient(90deg,#A941FB,#7864F0EB)] bg-clip-text text-transparent">Inksigma</span>
        </p>
      </div>
      
      {/* Bottom Links */}
      <div className="border-t border-b border-[#EDEDED] py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-20 text-xs text-[#A4A4A4]">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a href="#" className="hover:text-[#C0C0C0] transition-colors">Inksigma Website</a>
            <span>•</span>
            <a href="#" className="hover:text-[#C0C0C0] transition-colors">Terms and Conditions</a>
            <span>•</span>
            <a href="#" className="hover:text-[#C0C0C0] transition-colors">Privacy Policy</a>
          </div>
          <p className="text-center">
            Copyright © {currentYear} designed & developed by Inksigma, a Zamurai Inc. brand
          </p>
        </div>
      </div>
    </footer>
  );
}
