"use client"
import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function Verify() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't show verification banner if no session data
  if (!session?.user) {
    return null;
  }

  const user = session.user;
  
  // Check if email is already verified
  if (user.emailVerified) {
    return null;
  }

  // Check if user signed in with Google OAuth
  // Google users have avatar URLs from googleusercontent.com or image field
  const isGoogleUser = (user.avatar && user.avatar.includes('googleusercontent.com')) || 
                       (user.image && user.image.includes('googleusercontent.com'));
  
  // Check if user has an avatar/image (indicates OAuth login)
  const hasOAuthAvatar = !!(user.avatar || user.image);
  
  // Only show verification banner for email/password users who haven't verified
  // These users typically don't have OAuth avatars and have emailVerified: false
  if (isGoogleUser || (hasOAuthAvatar && user.emailVerified !== false)) {
    return null;
  }

  const handleVerifyClick = async () => {
    // Add your email verification logic here
    // This could trigger sending a verification email
    try {
      // You can implement the actual verification email sending here
      // Example: await sendVerificationEmail(user.email);
      console.log('Sending verification email to:', user.email);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  };

  // Check if we're on specific pages that need different layouts
  const isDashboard = pathname === '/dashboard';
  const isEditor = pathname === '/editor';

  // Dashboard uses inline styling
  if (isDashboard) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <p className="text-xs text-purple-900">Your Account hasn't been verified yet.</p>
        </div>
        <button 
          onClick={handleVerifyClick}
          className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-md text-xs transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          Verify your Account
        </button>
      </div>
    );
  }

  // Editor uses different positioning
  if (isEditor) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-5xl z-[25] px-4 md:px-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <p className="text-xs text-purple-900">Your Account hasn't been verified yet.</p>
          </div>
          <button 
            onClick={handleVerifyClick}
            className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-md text-xs transition-colors whitespace-nowrap w-full sm:w-auto"
          >
            Verify your Account
          </button>
        </div>
      </div>
    );
  }

  // For other pages with sidebar layout, use fixed positioning
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-[128px] w-full max-w-[1034px] z-[25] px-5 max-md:top-[110px]">
      <div className="ml-[185px] bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-md:ml-0">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <p className="text-xs text-purple-900">Your Account hasn't been verified yet.</p>
        </div>
        <button 
          onClick={handleVerifyClick}
          className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-md text-xs transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          Verify your Account
        </button>
      </div>
    </div>
  );
}