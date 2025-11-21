"use client"

import { useState, useRef, useEffect } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import imagePlaceholder from "@/icons/image-placeholder.svg";
import cameraIcon from "@/icons/camera.svg";

export default function CreatePublication() {
  const [publicationName, setPublicationName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleStartWriting = async () => {
    if (!publicationName.trim() || !subdomain.trim()) {
      setShowErrors(true);
      return;
    }

    // Validate lengths
    if (publicationName.length < 2 || publicationName.length > 50) {
      setShowErrors(true);
      return;
    }

    if (subdomain.length < 3 || subdomain.length > 63) {
      setShowErrors(true);
      return;
    }

    // Just redirect to home with any values
    try {
      await fetch("/api/publication/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: publicationName,
          subdomain: subdomain,
          image: uploadedImage,
        }),
      });

      // Redirect to home page
      window.location.href = "/home";
    } catch (error) {
      console.error("Error creating publication:", error);
      // Still redirect even on error
      window.location.href = "/home";
    }
  };

  // Auto-hide error messages after 3 seconds
  useEffect(() => {
    if (showErrors) {
      const timer = setTimeout(() => {
        setShowErrors(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showErrors]);

  // Close dropdown when clicking outside
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
        <div
          style={{
            width: '300px',
            gap: '40px',
            marginTop: '65px',
            opacity: 1
          }}
        >

          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className="text-[24px] font-bold leading-[100%] mb-2 bg-clip-text text-transparent"
              style={{
                fontFamily: 'Public Sans',
                fontWeight: 700,
                fontSize: '24px',
                lineHeight: '100%',
                letterSpacing: '0%',
                background: 'linear-gradient(244.98deg, #A941FB 16%, rgba(120, 100, 240, 0.92) 80.6%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Create Your Publication
            </h1>
            <p
              className="text-center"
              style={{
                fontFamily: 'Public Sans',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '150%',
                letterSpacing: '0%',
                color: '#404040'
              }}
            >
              Set up a publication & Start Writing
            </p>
          </div>

          {/* Image Upload Section */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt="Publication"
                  style={{
                    width: '114px',
                    height: '114px',
                    borderRadius: '96px',
                    borderWidth: '1px',
                    opacity: 1,
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <img
                  src={imagePlaceholder.src}
                  alt="Upload placeholder"
                  style={{
                    width: '114px',
                    height: '112px',
                    borderRadius: '96px',
                    borderWidth: '1px',
                    objectFit: 'cover',
                    opacity: 1
                  }}
                />
              )}

              {/* Camera or Edit Icon */}
              <button
                onClick={uploadedImage ? handleEditClick : handleCameraClick}
                className="absolute bottom-0 right-0 w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)'
                }}
              >
                {uploadedImage ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.9149 1.44775 13.1601 1.49653 13.3889 1.59129C13.6177 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <img
                    src={cameraIcon.src}
                    alt="Camera"
                    className="w-4 h-4"
                  />
                )}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && uploadedImage && (
                <div
                  ref={dropdownRef}
                  className="absolute bottom-[35px] left-[100px] bg-white rounded shadow-lg overflow-hidden z-10"
                  style={{
                    width: '120px',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <button
                    onClick={handleChangeImage}
                    className="w-full px-2 py-1.5 text-left text-[11px] text-[#333] hover:bg-[#F9FAFB] transition-colors"
                    style={{
                      fontFamily: 'Public Sans',
                      fontWeight: 400
                    }}
                  >
                    Change Image
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="w-full px-2 py-1.5 text-left text-[11px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                    style={{
                      fontFamily: 'Public Sans',
                      fontWeight: 400
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Red Error Message */}
          {showErrors && (
            <div className="mb-6">
              <div
                className="text-center"
                style={{
                  width: '300px',
                  height: '42px',
                  gap: '428px',
                  opacity: 1,
                  borderRadius: '4px',
                  paddingTop: '12px',
                  paddingRight: '16px',
                  paddingBottom: '12px',
                  paddingLeft: '16px',
                  background: '#FFD6D6'
                }}
              >
                <p
                  style={{
                    fontFamily: 'Public Sans',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '12px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#A30000'
                  }}
                >
                  Please fill in all required fields!
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-8">
            {/* Publication Name */}
            <div>
              <input
                type="text"
                placeholder="Enter your Publication Name"
                value={publicationName}
                minLength={2}
                maxLength={50}
                onChange={(e) => setPublicationName(e.target.value)}
                className="w-full px-0 py-2 border-0 border-b text-[14px] text-[#333] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#7C3AED] transition-colors bg-transparent"
                style={{
                  borderBottomWidth: '1.5px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: '#CBCBCB'
                }}
              />
            </div>

            {/* Subdomain */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Subdomain name"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  minLength={3}
                  maxLength={63}
                  className="w-full px-0 py-2 pr-[130px] border-0 border-b text-[14px] text-[#333] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#7C3AED] transition-colors bg-transparent"
                  style={{
                    borderBottomWidth: '1.5px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: '#CBCBCB'
                  }}
                />
                <span
                  className="absolute right-0 bottom-2"
                  style={{
                    fontFamily: 'Public Sans',
                    fontWeight: 400,
                    height: '21px',
                    width: '93px',
                    fontStyle: 'regular',
                    fontSize: '14px',
                    lineHeight: '150%',
                    letterSpacing: '0%',
                    color: '#000000'
                  }}
                >
                  .inksigma.com
                </span>
              </div>
            </div>

            {/* Start Writing Button */}
            <div className="pt-6">
              <button
                onClick={handleStartWriting}
                className="mx-auto text-[#7C3AED] text-[14px] font-medium hover:text-[#6D28D9] transition-colors flex items-center justify-center"
                style={{
                  gap: '8px',
                  opacity: 1,
                  paddingTop: '8px',
                  paddingRight: '4px',
                  paddingBottom: '8px',
                  paddingLeft: '4px'
                }}
              >
                Start Writing
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white py-4 text-center border-t border-[#F3F4F6] px-4">
        <p className="text-[12px] text-[#CCCCCC] max-md:text-[10px] max-sm:text-[9px]">
          Copyright © 2023 designed & developed by <a href="#" className="text-[#CCCCCC] underline underline-offset-2 hover:text-[#999]">Inksigma</a>, a <a href="#" className="text-[#CCCCCC] underline underline-offset-2 hover:text-[#999]">Zemuria Inc.</a> brand
        </p>
      </div>
    </>
  );
}
