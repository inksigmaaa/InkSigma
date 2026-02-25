"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getApiBase } from "@/utils/apiBase";
import { usePublication } from "@/contexts/PublicationContext";

export default function SettingsPage() {
  const router = useRouter();
  const apiBase = getApiBase();
  const { refreshCurrentPublication } = usePublication();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Publication data
  const [publicationId, setPublicationId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [originalSubdomain, setOriginalSubdomain] = useState("");
  const [logo, setLogo] = useState("/icons/inksigma-logo.svg");
  const [logoPreview, setLogoPreview] = useState("/icons/inksigma-logo.svg");
  const [favicon, setFavicon] = useState("/icons/inksigma-logo.svg");
  const [faviconPreview, setFaviconPreview] = useState(
    "/icons/inksigma-logo.svg",
  );
  const [metaOg, setMetaOg] = useState("/icons/inksigma-logo.svg");
  const [metaOgPreview, setMetaOgPreview] = useState(
    "/icons/inksigma-logo.svg",
  );

  useEffect(() => {
    loadPublicationData();
  }, []);

  const loadPublicationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user ID from session
      const sessionRes = await fetch(`${apiBase}/api/auth/get-session`, {
        credentials: "include",
      });

      if (!sessionRes.ok) {
        console.log("Not authenticated");
        setLoading(false);
        return;
      }

      const sessionData = await sessionRes.json();
      const userId = sessionData.user.id;
      const userName = sessionData.user.name || "My Publication";
      const userUsername =
        sessionData.user.username || `user${userId.substring(0, 8)}`;

      // Fetch publication data
      let pubRes = await fetch(`${apiBase}/api/publications/user/${userId}`, {
        credentials: "include",
      });

      // If no publication exists, create one
      if (pubRes.status === 404) {
        console.log("No publication found, creating one...");
        const createRes = await fetch(`${apiBase}/api/publications`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: userName,
            subdomain: userUsername.toLowerCase().replace(/[^a-z0-9]/g, ""),
            description: "Welcome to my publication",
            userId: userId,
          }),
        });

        if (createRes.ok) {
          pubRes = await fetch(`${apiBase}/api/publications/user/${userId}`, {
            credentials: "include",
          });
        }
      }

      if (pubRes.ok) {
        const pubData = await pubRes.json();
        setPublicationId(pubData.id);
        setName(pubData.name || "");
        setDescription(pubData.description || "");
        setSubdomain(pubData.subdomain || "");
        setOriginalSubdomain(pubData.subdomain || "");

        const logoUrl = pubData.logoUrl
          ? `${apiBase}${pubData.logoUrl}`
          : "/icons/inksigma-logo.svg";
        const faviconUrl = pubData.faviconUrl
          ? `${apiBase}${pubData.faviconUrl}`
          : "/icons/inksigma-logo.svg";
        const metaOgUrl = pubData.metaOgImageUrl
          ? `${apiBase}${pubData.metaOgImageUrl}`
          : "/icons/inksigma-logo.svg";

        setLogo(logoUrl);
        setLogoPreview(logoUrl);
        setFavicon(faviconUrl);
        setFaviconPreview(faviconUrl);
        setMetaOg(metaOgUrl);
        setMetaOgPreview(metaOgUrl);
      }
    } catch (err) {
      console.error("Load error:", err);
      // Don't show error to user, just log it
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!publicationId) {
      setError("Publication not found");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append(
        type === "logo" ? "logo" : type === "favicon" ? "favicon" : "metaOg",
        file,
      );

      const endpoint =
        type === "logo" ? "logo" : type === "favicon" ? "favicon" : "meta-og";
      const res = await fetch(
        `${apiBase}/api/publications/${publicationId}/${endpoint}`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      const imageUrl = `${apiBase}${data[type === "logo" ? "logoUrl" : type === "favicon" ? "faviconUrl" : "metaOgImageUrl"]}`;

      if (type === "logo") {
        setLogo(imageUrl);
        setLogoPreview(imageUrl);
        setSuccess("Logo updated!");
      } else if (type === "favicon") {
        setFavicon(imageUrl);
        setFaviconPreview(imageUrl);
        setSuccess("Favicon updated!");
      } else if (type === "meta_og") {
        setMetaOg(imageUrl);
        setMetaOgPreview(imageUrl);
        setSuccess("Meta OG image updated!");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Failed to upload ${type}: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        await handleImageUpload(file, "logo");
      }
    };
    input.click();
  };

  const handleFaviconChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setFaviconPreview(reader.result);
        };
        reader.readAsDataURL(file);

        await handleImageUpload(file, "favicon");
      }
    };
    input.click();
  };

  const handleMetaOgChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setMetaOgPreview(reader.result);
        };
        reader.readAsDataURL(file);

        await handleImageUpload(file, "meta_og");
      }
    };
    input.click();
  };

  const handleImageRemove = async (type) => {
    if (!publicationId) return;

    try {
      setUploading(true);
      const endpoint =
        type === "logo" ? "logo" : type === "favicon" ? "favicon" : "meta-og";

      const res = await fetch(
        `${apiBase}/api/publications/${publicationId}/image/${endpoint}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!res.ok) throw new Error("Failed to remove image");

      if (type === "logo") {
        setLogo("/icons/inksigma-logo.svg");
        setLogoPreview("/icons/inksigma-logo.svg");
      } else if (type === "favicon") {
        setFavicon("/icons/inksigma-logo.svg");
        setFaviconPreview("/icons/inksigma-logo.svg");
      } else if (type === "meta_og") {
        setMetaOg("/icons/inksigma-logo.svg");
        setMetaOgPreview("/icons/inksigma-logo.svg");
      }

      setSuccess(`${type} removed successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoRemove = () => handleImageRemove("logo");
  const handleFaviconRemove = () => handleImageRemove("favicon");
  const handleMetaOgRemove = () => handleImageRemove("meta_og");

  const handleSave = async () => {
    if (!publicationId) {
      setError("Publication not found");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate inputs
      if (!name || name.length < 2 || name.length > 50) {
        throw new Error("Publication name must be between 2 and 50 characters");
      }

      if (!subdomain || subdomain.length < 3 || subdomain.length > 63) {
        throw new Error("Subdomain must be between 3 and 63 characters");
      }

      if (description && description.length > 100) {
        throw new Error("Description must be less than 100 characters");
      }

      const res = await fetch(`${apiBase}/api/publications/${publicationId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          subdomain: subdomain.toLowerCase(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      const updatedPub = await res.json();

      // Refresh the publication context with updated data
      await refreshCurrentPublication();

      // Redirect to home page using router for client-side navigation
      router.push(`/${updatedPub.subdomain}/home`);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white flex justify-center p-4 sm:p-6 md:p-8 pt-[140px] md:pt-32 md:pl-64 mb-20 md:mb-0">
        <div className="w-[400px] h-[1100px] space-y-8">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            Publication Settings
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              Uploading image...
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {success}
            </div>
          )}

          {/* Logo Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div
                className={`w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden ${logoPreview === "/icons/inksigma-logo.svg" || logoPreview.includes("/icons/inksigma-logo.svg") ? "p-4" : ""}`}
              >
                <img
                  key={logoPreview}
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogoChange}
                  className="text-purple-500 text-sm hover:text-purple-600"
                >
                  Change Logo
                </button>
                <button
                  onClick={handleLogoRemove}
                  className="text-gray-400 text-sm hover:text-gray-600"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
              Optimal Resolution: 400 px X 400 px
            </p>
          </div>

          {/* Favicon Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div
                className={`w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden ${faviconPreview === "/icons/inksigma-logo.svg" || faviconPreview.includes("/icons/inksigma-logo.svg") ? "p-4" : ""}`}
              >
                <img
                  key={faviconPreview}
                  src={faviconPreview}
                  alt="Favicon"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleFaviconChange}
                  className="text-purple-500 text-sm hover:text-purple-600"
                >
                  Change Favicon
                </button>
                <button
                  onClick={handleFaviconRemove}
                  className="text-gray-400 text-sm hover:text-gray-600"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
              Optimal Resolution: 32 px X 32 px
            </p>
          </div>

          {/* Meta OG Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div
                className={`w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden ${metaOgPreview === "/icons/inksigma-logo.svg" || metaOgPreview.includes("/icons/inksigma-logo.svg") ? "p-4" : ""}`}
              >
                <img
                  key={metaOgPreview}
                  src={metaOgPreview}
                  alt="Meta OG"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleMetaOgChange}
                  className="text-purple-500 text-sm hover:text-purple-600"
                >
                  Change Meta OG
                </button>
                <button
                  onClick={handleMetaOgRemove}
                  className="text-gray-400 text-sm hover:text-gray-600"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
              Optimal Resolution: 630 px X 1200 px
            </p>
          </div>

          {/* Publication Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Publication Name
            </label>
            <input
              type="text"
              placeholder="Publication name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={50}
              className="w-full border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Publication Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Publication Description
              </label>
              <span className="text-xs text-gray-500">
                {(description || "").length}/100
              </span>
            </div>
            <textarea
              placeholder="Write publication Description"
              value={description || ""}
              onChange={(e) => setDescription(e.target.value.slice(0, 100))}
              rows={3}
              maxLength={100}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subdomain name
            </label>
            <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
              <input
                type="text"
                placeholder="Graceblog"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                minLength={3}
                maxLength={63}
                className="flex-1 text-sm focus:outline-none"
              />
              <span className="text-sm text-gray-600">.inksigma.com</span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors mb-6 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg py-12 px-14 max-w-[353px] w-full mx-4">
            <h2 className="text-sm font-semibold leading-none tracking-normal mb-4">
              Do you want to reset your password?
            </h2>
            <p className="text-sm font-normal leading-normal tracking-normal text-[#808080] mb-8">
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
                onClick={() => {
                  setShowResetModal(false);
                  setShowSuccessModal(true);
                }}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
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
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Settings Saved
              </h2>
              <p className="text-sm text-gray-500">
                Your publication settings have been updated successfully
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
