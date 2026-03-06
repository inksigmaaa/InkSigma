"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import imagePlaceholder from "@/icons/image-placeholder.svg";
import cameraIcon from "@/icons/camera.svg";
import { publicationService } from "@/services/publicationService";
import { usePublication } from "@/contexts/PublicationContext";
import { getApiBase } from "@/utils/apiBase";
import { validateSubdomain, isReservedSubdomain } from "@/utils/subdomainRules";
import { validatePublicationName } from "@/utils/domainValidation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CreatePublication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { loadUserPublications, switchPublication } = usePublication();
  const [publicationName, setPublicationName] = useState("");
  const [hasUserEditedName, setHasUserEditedName] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const subdomainCheckTimeout = useRef(null);

  // Extract name from email on component mount
  useEffect(() => {
    if (session?.user?.email && !publicationName && !hasUserEditedName) {
      const emailUsername = session.user.email.split("@")[0];
      // Capitalize first letter and replace dots/underscores with spaces
      const formattedName = emailUsername
        .replace(/[._]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setPublicationName(formattedName);
    }
  }, [session, publicationName, hasUserEditedName]);

  // Check subdomain availability with debounce
  // Frontend validation now handles format and reserved subdomain checks
  // Backend only checks database availability
  useEffect(() => {
    if (subdomainCheckTimeout.current) {
      clearTimeout(subdomainCheckTimeout.current);
    }

    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    // Use frontend validation for format and reserved subdomain checks
    const validation = validateSubdomain(subdomain);
    if (!validation.valid) {
      // Don't check backend if frontend validation fails
      setSubdomainAvailable(null);
      return;
    }

    setCheckingSubdomain(true);

    // Only check backend for database availability (not reserved, not format)
    subdomainCheckTimeout.current = setTimeout(async () => {
      try {
        const API_URL = getApiBase();
        const response = await fetch(
          `${API_URL}/api/publications/check-subdomain/${subdomain.toLowerCase()}`,
          {
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();
          setSubdomainAvailable(data.available);
        } else {
          setSubdomainAvailable(null);
        }
      } catch (error) {
        console.error("Error checking subdomain:", error);
        setSubdomainAvailable(null);
      } finally {
        setCheckingSubdomain(false);
      }
    }, 500);

    return () => {
      if (subdomainCheckTimeout.current) {
        clearTimeout(subdomainCheckTimeout.current);
      }
    };
  }, [subdomain]);

  const handleStartWriting = async () => {
    // Use frontend validation utilities
    const nameValidation = validatePublicationName(publicationName);
    if (!nameValidation.valid) {
      setErrorMessage(nameValidation.error);
      setShowErrors(true);
      return;
    }

    const subdomainValidation = validateSubdomain(subdomain);
    if (!subdomainValidation.valid) {
      setErrorMessage(subdomainValidation.error);
      setShowErrors(true);
      return;
    }

    // Check if subdomain is available in database
    if (subdomainAvailable === false) {
      setErrorMessage(
        "This subdomain is already taken. Please choose another one.",
      );
      setShowErrors(true);
      return;
    }

    if (!session?.user?.id) {
      setErrorMessage("User not authenticated!");
      setShowErrors(true);
      return;
    }

    setLoading(true);

    try {
      // First, verify authentication with the backend
      const API_URL = getApiBase();
      console.log("Verifying authentication with backend...");

      const authCheckResponse = await fetch(
        `${API_URL}/api/publications/debug/auth-check`,
        {
          credentials: "include",
        },
      );

      if (!authCheckResponse.ok) {
        console.error("Authentication check failed:", authCheckResponse.status);
        throw new Error("Authentication failed. Please log in again.");
      }

      const authCheckData = await authCheckResponse.json();
      console.log("Authentication verified:", authCheckData);

      // Create publication
      const publication = await publicationService.createPublication({
        name: publicationName,
        subdomain: subdomain.toLowerCase(),
      });

      console.log("Publication created:", publication);

      // Upload image if provided
      if (uploadedImage && publication.id) {
        try {
          console.log("Uploading logo for publication:", publication.id);

          // Convert base64 to blob
          const base64Response = await fetch(uploadedImage);
          const blob = await base64Response.blob();

          // Determine the correct mime type from the base64 string
          const mimeType =
            uploadedImage.match(/data:([^;]+);/)?.[1] || "image/png";

          // Map MIME types to proper file extensions
          const extensionMap = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/svg+xml": "svg",
            "image/svg": "svg",
          };

          const extension = extensionMap[mimeType] || "png";

          console.log("Image details:", {
            mimeType,
            extension,
            size: blob.size,
          });

          // Create file with correct mime type
          const file = new File([blob], `publication-logo.${extension}`, {
            type: mimeType,
          });

          const uploadResult = await publicationService.uploadLogo(
            publication.id,
            file,
          );
          console.log("Logo upload result:", uploadResult);
        } catch (error) {
          console.error("Failed to upload logo:", error);
          console.error("Error details:", error.message);
          // Show error but don't block navigation
          setErrorMessage(
            "Publication created but logo upload failed. You can upload it later in settings.",
          );
          setShowErrors(true);
        }
      } else {
        console.log("No image to upload or publication ID missing");
      }

      // Redirect to dashboard
      console.log("Refreshing user publications...");

      try {
        // Refresh the publication context to include the new publication
        await loadUserPublications();

        // Switch to the newly created publication
        const publicationWithMeta = {
          ...publication,
          isOwner: true,
          role: "admin",
          joinedAt: publication.createdAt,
        };

        switchPublication(publicationWithMeta);

        // Clear any cached publication check to force AuthGuard to recheck
        // This prevents the AuthGuard from redirecting back to create-publication
        const cacheKey = `publication-check-${session.user.id}`;
        sessionStorage.setItem(cacheKey, "true");
        sessionStorage.removeItem("publication-check-cache");

        // If we were sent here from an invite (or other flow), return there after creating.
        const redirectTo = searchParams?.get("redirect");
        const safeRedirect =
          redirectTo &&
          typeof redirectTo === "string" &&
          redirectTo.startsWith("/") &&
          !redirectTo.startsWith("//");

        if (safeRedirect) {
          router.push(redirectTo);
          return;
        }

        // Default: go to the new publication (canonical URL shape)
        if (publication?.subdomain) {
          router.push(`/${publication.subdomain}/home`);
        } else {
          router.push("/");
        }
      } catch (contextError) {
        console.error(
          "Failed to update context, redirecting to dashboard:",
          contextError,
        );
        // Clear cache and redirect to dashboard (myspace)
        const cacheKey = `publication-check-${session.user.id}`;
        sessionStorage.setItem(cacheKey, "true");
        sessionStorage.removeItem("publication-check-cache");
        router.push("/");
      }
    } catch (error) {
      console.error("Error creating publication:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
      });

      // Provide more helpful error messages
      let displayMessage = "Failed to create publication. Please try again.";

      if (error.status === 401) {
        displayMessage = "You are not authenticated. Please log in again.";
      } else if (error.status === 400) {
        displayMessage =
          error.message ||
          "Invalid input. Please check your publication name and subdomain.";
      } else if (error.message) {
        displayMessage = error.message;
      }

      setErrorMessage(displayMessage);
      setShowErrors(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showErrors) {
      const timer = setTimeout(() => {
        setShowErrors(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showErrors]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setShowDropdown(false);
  };

  const handleChangeImage = () => {
    setShowDropdown(false);
    fileInputRef.current?.click();
  };

  return (
    <AuthGuard>
      
      <div className="min-h-screen bg-white px-4 md:px-8 flex items-center justify-center">
        <div
          className="w-full max-w-[300px] md:max-w-[400px] mx-auto"
          style={{ gap: "40px", marginTop: "65px", opacity: 1 }}
        >
          <div className="text-center mb-8 md:mb-12">
            <h1
              className="text-[20px] md:text-[24px] font-bold leading-[100%] mb-2 bg-clip-text text-transparent"
              style={{
                fontFamily: "Public Sans",
                background:
                  "linear-gradient(244.98deg, #A941FB 16%, rgba(120, 100, 240, 0.92) 80.6%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome to InkSigma!
            </h1>
            <p className="text-center text-[12px] md:text-[14px] text-[#404040]">
              Set up a publication & Start Writing
            </p>
          </div>

          <div className="flex justify-center mb-6 md:mb-10">
            <div className="relative">
              <Avatar className="w-[100px] h-[100px] md:w-[114px] md:h-[114px] bg-gray-100">
                <AvatarImage
                  src={uploadedImage || imagePlaceholder.src}
                  alt={uploadedImage ? "Publication" : "Upload placeholder"}
                  className="w-full h-full object-cover"
                />
                <AvatarFallback className="w-full h-full bg-violet-100 text-violet-600 font-bold text-2xl">
                  {publicationName?.charAt(0).toUpperCase() || "P"}
                </AvatarFallback>
              </Avatar>

              <button
                onClick={uploadedImage ? handleEditClick : handleCameraClick}
                className="absolute bottom-0 right-0 w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  background:
                    "linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)",
                }}
              >
                {uploadedImage ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="md:w-4 md:h-4"
                  >
                    <path
                      d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.9149 1.44775 13.1601 1.49653 13.3889 1.59129C13.6177 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <img
                    src={cameraIcon.src}
                    alt="Camera"
                    className="w-3 h-3 md:w-4 md:h-4"
                  />
                )}
              </button>

              {showDropdown && uploadedImage && (
                <div
                  ref={dropdownRef}
                  className="absolute bottom-[30px] md:bottom-[35px] left-[80px] md:left-[100px] bg-white rounded shadow-lg z-10 w-[110px] md:w-[120px] border border-gray-200"
                >
                  <button
                    onClick={handleChangeImage}
                    className="w-full px-2 py-1.5 text-left text-[10px] md:text-[11px] text-[#333] hover:bg-[#F9FAFB]"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="w-full px-2 py-1.5 text-left text-[10px] md:text-[11px] text-[#A30000] hover:bg-[#FEF2F2]"
                  >
                    Remove Image
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-center text-[11px] md:text-[12px] text-[#999] mb-6 md:mb-8">
            Add a logo (optional)
          </p>

          {showErrors && (
            <div className="mb-4 md:mb-6">
              <div className="text-center w-full rounded border border-red-200 p-3 md:p-4 bg-[#FFD6D6]">
                <p className="text-[11px] md:text-[12px] text-[#A30000]">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6 md:space-y-8">
            <div>
              <input
                type="text"
                placeholder="Enter your Publication Name"
                value={publicationName}
                minLength={2}
                maxLength={50}
                onChange={(e) => {
                  setPublicationName(e.target.value);
                  setHasUserEditedName(true);
                }}
                disabled={loading}
                className="w-full px-0 py-2 border-0 border-b text-[13px] md:text-[14px] text-[#333] placeholder:text-[#CCCCCC] focus:outline-none bg-transparent disabled:opacity-50"
                style={{
                  borderBottomWidth: "1.5px",
                  borderBottomColor: "#CBCBCB",
                }}
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Subdomain name"
                  value={subdomain}
                  onChange={(e) => {
                    // Only allow alphanumeric and hyphens
                    const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, "");
                    setSubdomain(value);
                  }}
                  minLength={3}
                  maxLength={63}
                  disabled={loading}
                  className="w-full px-0 py-2 pr-[110px] md:pr-[130px] border-0 border-b text-[13px] md:text-[14px] text-[#333] placeholder:text-[#CCCCCC] focus:outline-none bg-transparent disabled:opacity-50"
                  style={{
                    borderBottomWidth: "1.5px",
                    borderBottomColor: "#CBCBCB",
                  }}
                />
                <span className="absolute right-0 bottom-2 text-[12px] md:text-[14px] text-black">
                  .inksigma.com
                </span>
              </div>
              {subdomain.length >= 3 && (
                <div className="mt-2 text-[10px] md:text-[11px]">
                  {(() => {
                    // Show frontend validation errors first
                    const validation = validateSubdomain(subdomain);
                    if (!validation.valid) {
                      return (
                        <span className="text-red-600">
                          ✗ {validation.error}
                        </span>
                      );
                    }
                    // Then show backend availability status
                    if (checkingSubdomain) {
                      return (
                        <span className="text-[#666]">
                          Checking availability...
                        </span>
                      );
                    }
                    if (subdomainAvailable === true) {
                      return (
                        <span className="text-green-600">
                          ✓ Subdomain available
                        </span>
                      );
                    }
                    if (subdomainAvailable === false) {
                      return (
                        <span className="text-red-600">
                          ✗ Subdomain already taken
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            <div className="pt-4 md:pt-6">
              <button
                onClick={handleStartWriting}
                disabled={loading}
                className="mx-auto text-[#7C3AED] text-[13px] md:text-[14px] font-medium hover:text-[#6D28D9] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-6 md:mb-8"
              >
                {loading ? "Creating Publication..." : "Start Writing"}
                <svg
                  width="6"
                  height="10"
                  viewBox="0 0 7 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:w-[7px] md:h-[11px]"
                >
                  <path
                    d="M0.700012 9.7002L5.20001 5.2002L0.700012 0.700195"
                    stroke="url(#paint0_linear_8797_4601)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_8797_4601"
                      x1="0.700012"
                      y1="1.44182"
                      x2="7.33046"
                      y2="4.72725"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#A941FB" />
                      <stop offset="1" stopColor="#7864F0" stopOpacity="0.92" />
                    </linearGradient>
                  </defs>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white py-3 md:py-4 text-center border-t border-[#F3F4F6] px-4">
        <p className="text-[10px] md:text-[12px] text-[#CCCCCC]">
          Copyright © 2023 designed & developed by{" "}
          <a href="#" className="text-[#CCCCCC] underline">
            Inksigma
          </a>
          , a{" "}
          <a href="#" className="text-[#CCCCCC] underline">
            Zemuria Inc.
          </a>{" "}
          brand
        </p>
      </div>
    </AuthGuard>
  );
}
