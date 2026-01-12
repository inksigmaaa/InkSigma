"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { memberService } from "@/services/memberService";
import { usePublication } from "@/contexts/PublicationContext";
import NavbarLoggedin from "@/app/components/navbar/NavbarLoggedin";

export default function AcceptInvitation() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setCurrentPublicationFromInvite } = usePublication();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/${token}/accept`);
    }
  }, [session, isPending, token, router]);

  const handleAccept = async () => {
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const result = await memberService.acceptInvitation(token);
      
      // Set the joined publication as current publication
      if (result.publication) {
        await setCurrentPublicationFromInvite(result.publication);
      }
      
      // Redirect to dashboard (myspace) instead of directly to publication
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <>
      <NavbarLoggedin />
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept Invitation</h1>
            <p className="text-gray-600">You've been invited to join a publication.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Accepting..." : "Accept Invitation"}
            </button>

            <button
              onClick={() => router.push(`/invite/${token}/decline`)}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </>
  );
}