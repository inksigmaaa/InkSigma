"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function InvitationPage() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;

    if (session) {
      // User is logged in, redirect to accept page
      router.push(`/invite/${token}/accept`);
    } else {
      // User is not logged in, redirect to login with return URL
      router.push(`/login?redirect=/invite/${token}/accept`);
    }
  }, [session, isPending, token, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}