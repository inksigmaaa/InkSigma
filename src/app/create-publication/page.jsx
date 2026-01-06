"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import imagePlaceholder from "@/icons/image-placeholder.svg";
import cameraIcon from "@/icons/camera.svg";
import { publicationService } from "@/services/publicationService";

export default function CreatePublication() {
  const router = useRouter();
  const { data: session } = useSession();
  const [publicationName, setPublicationName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleStartWriting = async () => {
    if (!publicationName.trim() || !subdomain.trim()) {
      setErrorMessage("Please fill in all required fields!");
      setShowErrors(true);
      return;
    }

    if (publicationName.length < 2 || publicationName.length > 50) {
      setErrorMessage("Publication name must be between 2 and 50 characters!");
      setShowErrors(true);
      return;
    }

    if (subdomain.length < 3 || subdomain.length > 63) {
      setErrorMessage("Subdomain must be between 3 and 63 characters!");
      setShowErrors(true);
      return;
    }

    // Validate subdomain format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
      setErrorMessage("Subdomain can only contain letters, numbers, and hyphens!");
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
      // Create publication
      const publication = await publicationService.createPublication({
        name: publicationName,
        subdomain: subdomain.toLowerCase(),
        description: "",
      });

      // Update user's name if it's different from publication name
      if (session.user.name !== publicationName) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/profile`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileName: publicationName,
          }),
        });

        if (!response.ok) {
          console.error('Failed to update user name');
        }
      }

      // Upload image if provided
      if (uploadedImage && publication.id) {
        try {
          // Convert base64 to file
          const response = await fetch(uploadedImage);
          const blob = await response.blob();
          const file = new File([blob], "publication-logo.png", { type: "image/png" });
          
          await publicationService.uploadLogo(publication.id, file);
        } catch (error) {
          console.error('Failed to upload logo:', error);
        }
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating publication:', error);
      setErrorMessage(error.message || "Failed to create publication. Please try again.");
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
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    <>
      <NavbarLoggedin />

      <div className="min-h-screen bg-white px-4 flex items-center justify-center">
        <div style={{ width: '300px', gap: '40px', marginTop: '65px', opacity: 1 }}>
          <div className="text-center mb-12">
            <h1
              className="text-[24px] font-bold leading-[100%] mb-2 bg-clip-text text-transparent"
              style={{
                fontFamily: 'Public Sans',
                background: 'linear-gradient(244.98deg, #A941FB 16%, rgba(120, 100, 240, 0.92) 80.6%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Create Your Publication
            </h1>
            <p className="text-center text-[14px] text-[#404040]">
              Set up a publication & Start Writing
            </p>
          </div>

          <div className="flex justify-center mb-10">
            <div className="relative">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Publication" style={{ width: '114px', height: '114px', borderRadius: '96px', objectFit: 'cover' }} />
              ) : (
                <img src={imagePlaceholder.src} alt="Upload placeholder" style={{ width: '114px', height: '112px', borderRadius: '96px', objectFit: 'cover' }} />
              )}

              <button
                onClick={uploadedImage ? handleEditClick : handleCameraClick}
                className="absolute bottom-0 right-0 w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)' }}
              >
                {uploadedImage ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.9149 1.44775 13.1601 1.49653 13.3889 1.59129C13.6177 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <img src={cameraIcon.src} alt="Camera" className="w-4 h-4" />
                )}
              </button>

              {showDropdown && uploadedImage && (
                <div ref={dropdownRef} className="absolute bottom-[35px] left-[100px] bg-white rounded shadow-lg z-10" style={{ width: '120px', border: '1px solid #E5E7EB' }}>
                  <button onClick={handleChangeImage} className="w-full px-2 py-1.5 text-left text-[11px] text-[#333] hover:bg-[#F9FAFB]">Change Image</button>
                  <button onClick={handleRemoveImage} className="w-full px-2 py-1.5 text-left text-[11px] text-[#DC2626] hover:bg-[#FEF2F2]">Remove Image</button>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {showErrors && (
            <div className="mb-6">
              <div className="text-center" style={{ width: '300px', borderRadius: '4px', padding: '12px 16px', background: '#FFD6D6' }}>
                <p style={{ fontSize: '12px', color: '#A30000' }}>{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-8">
            <div>
              <input
                type="text"
                placeholder="Enter your Publication Name"
                value={publicationName}
                minLength={2}
                maxLength={50}
                onChange={(e) => setPublicationName(e.target.value)}
                disabled={loading}
                className="w-full px-0 py-2 border-0 border-b text-[14px] text-[#333] placeholder:text-[#CCCCCC] focus:outline-none bg-transparent disabled:opacity-50"
                style={{ borderBottomWidth: '1.5px', borderBottomColor: '#CBCBCB' }}
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Subdomain name"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  minLength={3}
                  maxLength={63}
                  disabled={loading}
                  className="w-full px-0 py-2 pr-[130px] border-0 border-b text-[14px] text-[#333] placeholder:text-[#CCCCCC] focus:outline-none bg-transparent disabled:opacity-50"
                  style={{ borderBottomWidth: '1.5px', borderBottomColor: '#CBCBCB' }}
                />
                <span className="absolute right-0 bottom-2 text-[14px] text-black">.inksigma.com</span>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleStartWriting}
                disabled={loading}
                className="mx-auto text-[#7C3AED] text-[14px] font-medium hover:text-[#6D28D9] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Start Writing"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white py-4 text-center border-t border-[#F3F4F6] px-4">
        <p className="text-[12px] text-[#CCCCCC]">
          Copyright © 2023 designed & developed by <a href="#" className="text-[#CCCCCC] underline">Inksigma</a>, a <a href="#" className="text-[#CCCCCC] underline">Zemuria Inc.</a> brand
        </p>
      </div>
    </>
  );
}
