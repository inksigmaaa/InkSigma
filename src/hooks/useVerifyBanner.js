import { useSession } from "@/lib/auth-client";

export const useVerifyBanner = () => {
  const { data: session } = useSession();

  // Don't show verification banner if no session data
  if (!session?.user) {
    return false;
  }

  const user = session.user;
  
  // Check if email is already verified
  if (user.emailVerified) {
    return false;
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
    return false;
  }

  return true;
};