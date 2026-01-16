'use client';

import Link from 'next/link';

export default function Footer({ publicationName = 'Jasmin blogs' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-gray-200 pt-10">
      <div className="flex flex-col items-center gap-4 pb-8">
        {/* Publication Name */}
        <p className="text-gray-400 text-sm">© {currentYear} {publicationName}</p>
        
        {/* CTA Text */}
        <p className="text-gray-900 text-sm font-semibold leading-none">Eager to delve into the art of blog writing?</p>
        
        {/* Start Writing Button */}
        <Link 
          href="/editor"
          className="px-4 py-2 bg-[#202020] text-white text-sm font-medium rounded hover:bg-gray-800"
          style={{ minWidth: '118px', textAlign: 'center' }}
        >
          Start Writing
        </Link>
        
        {/* Made with InkSigma */}
        <p className="text-gray-400 text-xs font-normal leading-normal">
          Made with <span className="text-purple-500">Inksigma</span>
        </p>
      </div>
      
      {/* Bottom Links */}
      <div className="border-t border-b border-[#EDEDED] py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-20 text-xs text-gray-400">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Link href="#" className="hover:text-gray-600 transition-colors">Inksigma Website</Link>
            <span>•</span>
            <Link href="#" className="hover:text-gray-600 transition-colors">Terms and Conditions</Link>
            <span>•</span>
            <Link href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-center">
            Copyright © {currentYear} designed & developed by Inksigma, a Zamurai Inc. brand
          </p>
        </div>
      </div>
    </footer>
  );
}
