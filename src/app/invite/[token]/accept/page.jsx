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
  const [success, setSuccess] = useState(false);
  const [joinedPublication, setJoinedPublication] = useState(null);

  useEffect(() => {
    if (!isPending && !session) {
      // Redirect to login with return URL
      router.push(`/sign-in?returnUrl=/invite/${token}/accept`);
    }
  }, [session, isPending, token, router]);

  const handleAccept = async () => {
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const result = await memberService.acceptInvitation(token);
      setSuccess(true);
      
      // Set the joined publication as current publication
      if (result.publication) {
        const publication = setCurrentPublicationFromInvite(result.publication);
        setJoinedPublication(publication);
      }
      
      // Redirect to myspace with the joined publication after 2 seconds
      setTimeout(() => {
        router.push("/myspace");
      }, 2000);
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

  if (success && joinedPublication) {
    return (
      <>
        <NavbarLoggedin />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the team!</h1>
              <p className="text-lg text-gray-600">
                You've successfully joined <span className="font-semibold text-violet-600">{joinedPublication.name}</span>
              </p>
            </div>

            {/* Publication Details Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex items-start gap-6">
                {joinedPublication.logoUrl ? (
                  <img
                    src={joinedPublication.logoUrl}
                    alt={joinedPublication.name}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-600 font-bold text-xl">
                      {joinedPublication.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{joinedPublication.name}</h2>
                  {joinedPublication.description && (
                    <p className="text-gray-600 mb-4">{joinedPublication.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-violet-600">{joinedPublication.role.charAt(0).toUpperCase() + joinedPublication.role.slice(1)}</div>
                      <div className="text-sm text-gray-500">Your Role</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{joinedPublication.memberCount}</div>
                      <div className="text-sm text-gray-500">Members</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{joinedPublication.postCount}</div>
                      <div className="text-sm text-gray-500">Posts</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {new Date(joinedPublication.createdAt).getFullYear()}
                      </div>
                      <div className="text-sm text-gray-500">Created</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Permissions */}
              <div className="mt-6 p-4 bg-violet-50 rounded-lg">
                <h3 className="font-semibold text-violet-900 mb-2">
                  As {joinedPublication.role.charAt(0).toUpperCase() + joinedPublication.role.slice(1)}, you can:
                </h3>
                <ul className="text-violet-800 space-y-1">
                  {joinedPublication.role === 'editor' ? (
                    <>
                      <li>• Create and edit all posts</li>
                      <li>• Publish content immediately</li>
                      <li>• Manage publication settings</li>
                      <li>• View all members and analytics</li>
                    </>
                  ) : (
                    <>
                      <li>• Create and edit your own posts</li>
                      <li>• Submit drafts for review</li>
                      <li>• View publication members</li>
                      <li>• Access writing tools and resources</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/myspace")}
                className="bg-violet-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
              >
                Continue to My Space
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-white text-violet-600 border-2 border-violet-600 px-8 py-3 rounded-lg font-semibold hover:bg-violet-50 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Redirecting to My Space in <span className="font-semibold">2 seconds</span>...
            </p>
          </div>
        </div>
      </>
    );
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