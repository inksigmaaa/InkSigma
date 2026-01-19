"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { memberService } from "@/services/memberService";
import { usePublication } from "@/contexts/PublicationContext";
import NavbarLoggedin from "@/app/components/navbar/NavbarLoggedin";
import { signOut } from "@/lib/auth-client";

export default function AcceptInvitation() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setCurrentPublicationFromInvite } = usePublication();
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(true);
  const [error, setError] = useState("");
  const [invitationDetails, setInvitationDetails] = useState(null);

  useEffect(() => {
    if (!isPending && !session) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/${token}/accept`);
    }
  }, [session, isPending, token, router]);

  // Fetch invitation details when user is logged in
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!session || !token) return;

      setFetchingDetails(true);
      setError("");

      try {
        const details = await memberService.getInvitationDetails(token);
        setInvitationDetails(details);
      } catch (error) {
        setError(error.message);
      } finally {
        setFetchingDetails(false);
      }
    };

    if (session) {
      fetchInvitationDetails();
    }
  }, [session, token]);

  // Add a timeout to prevent indefinite loading
  useEffect(() => {
    if (fetchingDetails) {
      const timeout = setTimeout(() => {
        setFetchingDetails(false);
        if (!invitationDetails) {
          setError("Failed to load invitation details. Please try again.");
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [fetchingDetails, invitationDetails]);

  const handleAccept = async () => {
    if (!session) return;

    // Double check email match before accepting
    if (invitationDetails?.email && session.user?.email && 
        invitationDetails.email.toLowerCase() !== session.user.email.toLowerCase()) {
      setError(`This invitation is for ${invitationDetails.email}, but you are logged in as ${session.user.email}`);
      return;
    }

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

  const handleSwitchAccount = async () => {
    await signOut({
        fetchOptions: {
            onSuccess: () => {
                router.push(`/login?redirect=/invite/${token}/accept`);
            },
        },
    });
  };

  if ((isPending && !session) || (fetchingDetails && !invitationDetails)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-violet-600 rounded-full animate-spin"></div>
          <div className="text-gray-600 text-sm">Loading invitation details...</div>
        </div>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
            <p className="text-gray-600">You've been invited to join a publication.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {invitationDetails?.email && session?.user?.email && 
             invitationDetails.email.toLowerCase() !== session.user.email.toLowerCase() ? (
              <div className="mb-6 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-amber-800 font-medium mb-2">Account Mismatch</h3>
                  <p className="text-amber-700 text-sm">
                    This invitation was sent to <strong>{invitationDetails.email}</strong>, 
                    but you are currently logged in as <strong>{session.user.email}</strong>.
                  </p>
                  <p className="text-amber-700 text-sm mt-2">
                    Please switch to the correct account to accept this invitation.
                  </p>
                </div>
                
                <button
                  onClick={handleSwitchAccount}
                  className="w-full bg-white text-gray-900 border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Switch Account
                </button>
              </div>
            ) : (
              <button
                onClick={handleAccept}
                disabled={loading || !invitationDetails}
                className="w-full bg-violet-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Accepting..." : "Accept Invitation"}
              </button>
            )}

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