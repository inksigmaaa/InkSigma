"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { memberService } from "@/services/memberService";
import { usePublication } from "@/contexts/PublicationContext";
import SetPasswordForm from "@/components/auth/SetPasswordForm";
import { signOut } from "@/lib/auth-client";
import { getApiBase } from "@/utils/apiBase";

export default function AcceptInvitation() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setCurrentPublicationFromInvite } = usePublication();
  const [loading, setLoading] = useState(true);
  const [fetchingDetails, setFetchingDetails] = useState(true);
  const [error, setError] = useState("");
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [emailMismatch, setEmailMismatch] = useState(false);
  const acceptAttempted = useRef(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Ensure invite flows happen on the dashboard host so auth cookies work consistently.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost");
    const desiredHost =
      rootDomain === "localhost"
        ? "dashboard.localhost"
        : `dashboard.${rootDomain}`;
    const currentHost = window.location.hostname.toLowerCase();

    const isDashboardHost =
      currentHost === desiredHost ||
      currentHost === "dashboard.localhost" ||
      currentHost.startsWith("dashboard.");

    if (!isDashboardHost) {
      const port = window.location.port ? `:${window.location.port}` : "";
      const target = `${window.location.protocol}//${desiredHost}${port}/invite/${token}/accept${window.location.search || ""}`;
      window.location.replace(target);
    }
  }, [token]);

  // Wait for useSession to fully resolve before making any auth decisions.
  // Use a stabilization delay to prevent false login redirects on initial load.
  useEffect(() => {
    if (session) {
      // Session found — immediately mark as ready
      setSessionReady(true);
      return;
    }

    if (!isPending && !session) {
      // isPending is false and no session — wait a moment before deciding.
      // This handles the case where isPending briefly starts as false
      // before the session check begins.
      const timeout = setTimeout(() => {
        setSessionReady(true);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [session, isPending]);

  useEffect(() => {
    // Only redirect to login once session check has fully stabilized
    if (sessionReady && !session) {
      router.push(`/login?redirect=/invite/${token}/accept`);
    }
  }, [sessionReady, session, token, router]);

  // If invited member is a brand-new user (no owned publication), force create-publication first.
  // After creation we return back here via ?redirect=/invite/{token}/accept.
  useEffect(() => {
    const ensureOwnedPublication = async () => {
      if (!session?.user?.id || !token) return;

      try {
        const apiBase = getApiBase();
        const ownedRes = await fetch(`${apiBase}/api/publications/check`, {
          credentials: "include",
        });

        if (ownedRes.ok) {
          const data = await ownedRes.json().catch(() => null);
          const hasOwned = Boolean(data?.hasPublication);
          if (!hasOwned) {
            router.replace(
              `/create-publication?redirect=${encodeURIComponent(
                `/invite/${token}/accept`,
              )}`,
            );
          }
        }
      } catch (err) {
        console.error("Error checking owned publication:", err);
      }
    };

    ensureOwnedPublication();
  }, [session?.user?.id, token, router]);

  // Fetch invitation details when user is logged in
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!session || !token) return;

      setFetchingDetails(true);
      setError("");

      try {
        const details = await memberService.getInvitationDetails(token);
        setInvitationDetails(details);

        // Check email mismatch
        if (
          details?.email &&
          session.user?.email &&
          details.email.toLowerCase() !== session.user.email.toLowerCase()
        ) {
          setEmailMismatch(true);
          setLoading(false);
        }
      } catch (error) {
        setError(error.message);
        setLoading(false);
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
          setLoading(false);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [fetchingDetails, invitationDetails]);

  // Auto-accept invitation once details are loaded and emails match
  useEffect(() => {
    const autoAccept = async () => {
      if (
        !session ||
        !invitationDetails ||
        emailMismatch ||
        acceptAttempted.current
      )
        return;

      acceptAttempted.current = true;
      setLoading(true);
      setError("");

      try {
        const result = await memberService.acceptInvitation(token);

        // Set the joined publication as current publication
        if (result.publication) {
          await setCurrentPublicationFromInvite(result.publication);
        }

        // Redirect to dashboard (My Space)
        router.push("/");
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    autoAccept();
  }, [
    session,
    invitationDetails,
    emailMismatch,
    token,
    router,
    setCurrentPublicationFromInvite,
  ]);

  const handleSwitchAccount = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(`/login?redirect=/invite/${token}/accept`);
        },
      },
    });
  };

  if ((isPending && !session) || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-violet-600 rounded-full animate-spin"></div>
          <div className="text-gray-600 text-sm">
            {error ? "Something went wrong..." : "Accepting invitation..."}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  // Show error state
  if (error && !emailMismatch) {
    return (
      <>
        <NavbarLoggedin />
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Unable to Accept Invitation
              </h1>
              <p className="text-gray-600">{error}</p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="bg-violet-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-violet-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  // Show email mismatch UI (only case with interactive buttons)
  if (emailMismatch && invitationDetails) {
    return (
      <>
        <NavbarLoggedin />
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Account Mismatch
              </h1>
            </div>

            <div className="mb-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-amber-800 font-medium mb-2">
                  Account Mismatch
                </h3>
                <p className="text-amber-700 text-sm">
                  This invitation was sent to{" "}
                  <strong>{invitationDetails.email}</strong>, but you are
                  currently logged in as <strong>{session.user.email}</strong>.
                </p>
                <p className="text-amber-700 text-sm mt-2">
                  Please switch to the correct account to accept this
                  invitation.
                </p>
              </div>

              <button
                onClick={handleSwitchAccount}
                className="w-full bg-white text-gray-900 border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Switch Account
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
