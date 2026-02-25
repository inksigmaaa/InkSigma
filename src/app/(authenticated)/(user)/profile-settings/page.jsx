"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import UserAvatar from "@/components/ui/UserAvatar";
import { useSession } from "@/lib/auth-client";
import { getApiBase } from "@/utils/apiBase";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const fileInputRef = useRef(null);
  const API_URL = getApiBase(); // Get API URL dynamically based on current hostname
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [initialProfile, setInitialProfile] = useState({
    profileName: "",
    username: "",
    bio: "",
  });
  const [bio, setBio] = useState("");
  const [profileName, setProfileName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [error, setError] = useState("");
  const [hasPasswordAccount, setHasPasswordAccount] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [bottomToast, setBottomToast] = useState({
    id: 0,
    message: "",
    type: "success",
  });
  const toastTimerRef = useRef(null);

  const showBottomToast = useCallback(
    (message, type = "error", duration = 3000) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      const id = Date.now();
      setBottomToast({ id, message, type });

      toastTimerRef.current = setTimeout(() => {
        setBottomToast((prev) =>
          prev.id === id ? { ...prev, message: "" } : prev,
        );
      }, duration);
    },
    [],
  );

  useEffect(() => {
    if (!error) return;
    showBottomToast(error, "error", 3000);
    setError("");
  }, [error, showBottomToast]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      console.log("[ProfileSettings] Fetching profile from:", API_URL);
      console.log("[ProfileSettings] Session:", session);
      console.log("[ProfileSettings] isPending:", isPending);

      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          credentials: "include",
        });

        console.log(
          "[ProfileSettings] Profile response status:",
          response.status,
        );

        if (response.ok) {
          const data = await response.json();
          console.log("[ProfileSettings] Profile data received:", data);
          setEmail(data.email || "");
          setProfileName(data.profileName || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
          setInitialProfile({
            profileName: data.profileName || "",
            username: data.username || "",
            bio: data.bio || "",
          });
          setImage(data.image || "");
          setImagePreview(data.image || "");
          setHasPasswordAccount(data.hasPasswordAccount || false);
        } else if (response.status === 401) {
          console.error(
            "[ProfileSettings] Unauthorized - redirecting to login",
          );
          router.push("/login");
        } else {
          console.error(
            "[ProfileSettings] Unexpected response status:",
            response.status,
          );
        }
      } catch (error) {
        console.error("[ProfileSettings] Error fetching profile:", error);
        setError("Failed to load profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    // Wait for session to be determined before checking
    if (isPending) {
      console.log("[ProfileSettings] Session is still loading, waiting...");
      return;
    }

    if (session?.user) {
      console.log("[ProfileSettings] Session found, fetching profile");
      fetchProfile();
    } else {
      console.error(
        "[ProfileSettings] No session found - redirecting to login",
      );
      setIsLoading(false);
      router.push("/login");
    }
  }, [session, isPending, router, API_URL]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showBottomToast("Please select an image file", "error", 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showBottomToast("Image must be less than 5MB", "error", 3000);
      return;
    }

    setError("");
    setSelectedImageFile(file);
    setIsImageRemoved(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setError("");
    setImagePreview("");
    setSelectedImageFile(null);
    setIsImageRemoved(true);
  };

  const handleSave = async () => {
    if (!hasProfileChanges) return;

    try {
      setIsSaving(true);
      setError("");

      // Handle Image Remove
      if (isImageRemoved) {
        const imgRes = await fetch(`${API_URL}/api/profile/image`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!imgRes.ok) {
          const d = await imgRes.json();
          setError(d.error || "Failed to remove image");
          setIsSaving(false);
          return;
        }
      }
      // Handle Image Upload
      else if (selectedImageFile) {
        const formData = new FormData();
        formData.append("image", selectedImageFile);

        const imgRes = await fetch(`${API_URL}/api/profile/image`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!imgRes.ok) {
          const d = await imgRes.json();
          setError(d.error || "Failed to upload image");
          setIsSaving(false);
          return;
        }

        const d = await imgRes.json();
        setImage(d.imageUrl);
        setImagePreview(d.imageUrl);
      } else if (!isImageRemoved) {
        // If image wasn't changed, keep existing image
        setImagePreview(imagePreview);
      }

      // Handle Content Update
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          profileName,
          username,
          bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save profile");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      setInitialProfile({ profileName, username, bio });
      setSelectedImageFile(null);
      setIsImageRemoved(false);
      if (isImageRemoved) setImage("");

      showBottomToast("Settings Updated", "success", 2500);

      // Emit storage event to signal other components to refresh
      localStorage.setItem('profileUpdated', Date.now().toString());

      // Force refresh by re-fetching profile data directly and updating localStorage
      try {
        // Fetch fresh profile data directly from API
        const profileRes = await fetch(`${API_URL}/api/profile`, {
          credentials: "include",
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          // Store fresh data for other components to access
          localStorage.setItem('freshUserData', JSON.stringify(profileData));
        }
        await refetch();
      } catch (refetchError) {
        console.error("Failed to refresh session:", refetchError);
      }

      // Refresh Next.js router for server components
      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile. Please try again.");
      setIsSaving(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <>
        <div className="min-h-screen bg-white flex justify-center items-center p-4 pt-[140px] md:pt-32 md:pl-64">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </>
    );
  }

  // If no session after loading, redirect to login
  if (!session?.user) {
    router.push("/login");
    return null;
  }

  // User object for avatar
  const userForAvatar = {
    email,
    name: profileName,
    image: imagePreview,
  };

  const hasProfileChanges =
    profileName !== initialProfile.profileName ||
    username !== initialProfile.username ||
    bio !== initialProfile.bio ||
    selectedImageFile !== null ||
    isImageRemoved;

  return (
    <>
      <div className="min-h-screen bg-white flex justify-center p-4 sm:p-6 md:p-8 pt-[140px] md:pt-32 md:pl-64 pb-24 md:pb-8">
        <div className="w-full max-w-[800px] space-y-8">
          <h1 className="h-[28px] opacity-100 font-bold text-[16px] text-center leading-[28px] tracking-[0%] text-[#000000]">
            Profile Settings
          </h1>

          <div className="flex flex-col items-center">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div
                className={`w-[100px] h-[100px] rounded-[52px] overflow-hidden bg-gray-200 flex items-center justify-center border-gray-300 ${isSaving ? "opacity-50" : "opacity-100"}`}
              >
                <UserAvatar
                  user={userForAvatar}
                  size="xl"
                  className="w-full h-full"
                />
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              {/* Change/Remove buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="w-[69px] h-[24px] opacity-100 gap-2 pt-[4px] pr-[8px] pb-[4px] pl-[8px] text-purple-500 hover:text-purple-600 text-sm font-medium disabled:opacity-50"
                >
                  Change
                </button>
                <button
                  onClick={handleRemoveImage}
                  disabled={isSaving || !imagePreview}
                  className="w-[69px] h-[24px] opacity-100 gap-2 pt-[4px] pr-[8px] pb-[4px] pl-[8px] text-gray-400 hover:text-gray-600 text-sm font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="w-full max-w-[258.5px] mt-12 space-y-8">
              {/* Profile Name */}
              <div>
                <label className="block text-black font-bold text-sm mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  minLength={3}
                  maxLength={32}
                  placeholder="Enter your Profile name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border-b border-gray-300 py-2 text-sm text-gray-900 placeholder-[#C8C8C8] placeholder:text-sm focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-black font-bold text-sm mb-2">
                  Username
                </label>
                <input
                  type="text"
                  minLength={3}
                  maxLength={20}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-b border-gray-300 py-2 text-sm text-gray-900 placeholder-[#C8C8C8] placeholder:text-sm focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Email ID - Read Only */}
              <div>
                <label className="block text-black font-bold text-sm mb-2">
                  Email ID
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full border-b border-gray-300 py-2 text-sm text-gray-500 placeholder-[#C8C8C8] placeholder:text-sm  focus:outline-none cursor-not-allowed bg-gray-50"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-black font-bold text-sm mb-2">
                  Bio
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Write your bio"
                    maxLength={200}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 pr-12 text-sm text-gray-900 placeholder-[#C8C8C8] placeholder:text-sm focus:outline-none focus:border-gray-500"
                  />
                  <span className="absolute right-0 bottom-2 text-xs text-gray-400">
                    {bio.length}/200
                  </span>
                </div>
              </div>

              {/* Reset Account Password */}
              {hasPasswordAccount && (
                <div className="flex justify-center mt-16">
                  <button
                    className="w-[162px] h-auto text-[#4B4B4B] hover:text-gray-700 border-b border-gray-500 text-sm"
                    onClick={() => setShowResetModal(true)}
                  >
                    Reset Account Password
                  </button>
                </div>
              )}
              {!hasPasswordAccount && (
                <div className="flex justify-center mt-16">
                  <p className="text-gray-400 text-sm text-center">
                    You signed in with a social provider. Password reset is not
                    available.
                  </p>
                </div>
              )}

              {/* Update Button */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasProfileChanges}
                  className="w-[259px] h-[32px] rounded-[4px] bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black text-sm"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {bottomToast.message && (
        <div className="fixed bottom-0 left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-[10001] w-[90%] max-w-[380px] pb-[max(8px,env(safe-area-inset-bottom))]">
          <div
            className={`w-full rounded-md px-4 py-2 text-sm font-medium text-center shadow-md ${
              bottomToast.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-green-100 text-green-800 border border-green-200"
            }`}
          >
            {bottomToast.message}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Do you want to reset your password?
            </h2>
            <p className="text-gray-500 mb-8">
              we will send you a link to your Email and You will be logged out
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  setShowResetModal(false);
                  setIsResettingPassword(true);
                  try {
                    const response = await fetch(
                      `${API_URL}/api/auth/forget-password`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({
                          email: email,
                          redirectTo: `${window.location.origin}/reset-password`,
                        }),
                      },
                    );

                    if (response.ok) {
                      setShowSuccessModal(true);
                    } else {
                      const data = await response.json();
                      setError(data.error || "Failed to send reset email");
                    }
                  } catch (error) {
                    console.error("Error sending reset email:", error);
                    setError("Failed to send reset email. Please try again.");
                  } finally {
                    setIsResettingPassword(false);
                  }
                }}
                disabled={isResettingPassword}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isResettingPassword ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Password Reset */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Mail Sent
              </h2>
              <p className="text-gray-500">
                A link has been to your registered Email ID
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
