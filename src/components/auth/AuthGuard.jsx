"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children, redirectTo = "/login" }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while session is loading
    if (isPending) return;

    // If no session exists, redirect to login
    if (!session?.user) {
      router.push(redirectTo);
      return;
    }
  }, [session, isPending, router, redirectTo]);

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!session?.user) {
    return null;
  }

  // User is authenticated, render the protected content
  return children;
}