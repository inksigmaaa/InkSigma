"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getApiBase } from "@/utils/apiBase";
import { getImageUrl } from "@/utils/imageUrl";
import { usePublication } from "@/contexts/PublicationContext";
import { getRootDomain } from "@/utils/publicationDomain";
import { validateSubdomain, normalizeSubdomain } from "@/utils/subdomainRules";
import { toast } from "sonner";

const DEFAULT_PUBLICATION_IMAGE = "/icons/inksigma-logo.svg";
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "ico",
]);
const IMAGE_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  ".ico",
].join(",");

const getFileExtension = (fileName = "") =>
  fileName.split(".").pop()?.toLowerCase() || "";

const getImageUploadValidationError = (file) => {
  if (!file) return "No image selected";

  const extension = getFileExtension(file.name);
  const hasAllowedMime = ALLOWED_IMAGE_MIME_TYPES.has(file.type);
  const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.has(extension);

  if (!hasAllowedMime && !hasAllowedExtension) {
    return "Only JPG, PNG, GIF, WebP, SVG, or ICO images are allowed";
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Image must be smaller than 5MB";
  }

  return null;
};

const getUploadErrorMessage = async (response, fallback = "Upload failed") => {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
};

const IMAGE_UPLOAD_TOAST_ID = "publication-image-upload";

const getImageTypeLabel = (type) => {
  if (type === "meta_og") return "Meta OG image";
  if (type === "favicon") return "Favicon";
  return "Logo";
};

export default function SettingsPage() {
  const router = useRouter();
  const apiBase = getApiBase();
  const { currentPublication, refreshCurrentPublication } = usePublication();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  // Publication data
  const [publicationId, setPublicationId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [originalSubdomain, setOriginalSubdomain] = useState("");
  const [logo, setLogo] = useState(DEFAULT_PUBLICATION_IMAGE);
  const [logoPreview, setLogoPreview] = useState(DEFAULT_PUBLICATION_IMAGE);
  const [favicon, setFavicon] = useState(DEFAULT_PUBLICATION_IMAGE);
  const [faviconPreview, setFaviconPreview] = useState(
    DEFAULT_PUBLICATION_IMAGE,
  );
  const [metaOg, setMetaOg] = useState(DEFAULT_PUBLICATION_IMAGE);
  const [metaOgPreview, setMetaOgPreview] = useState(
    DEFAULT_PUBLICATION_IMAGE,
  );

  const loadPublicationData = useCallback(async () => {
    try {
      setLoading(true);

      const targetPublicationId = currentPublication?.id;
      if (!targetPublicationId) {
        setLoading(false);
        return;
      }

      const pubRes = await fetch(
        `${apiBase}/api/publications/${targetPublicationId}`,
        {
          credentials: "include",
        },
      );

      if (pubRes.ok) {
        const pubData = await pubRes.json();
        setPublicationId(pubData.id);
        setName(pubData.name || "");
        setDescription(pubData.description || "");
        setSubdomain(pubData.subdomain || "");
        setOriginalSubdomain(pubData.subdomain || "");
        const logoUrl =
          getImageUrl(pubData.logoUrl) || DEFAULT_PUBLICATION_IMAGE;
        const faviconUrl =
          getImageUrl(pubData.faviconUrl) || DEFAULT_PUBLICATION_IMAGE;
        const metaOgUrl =
          getImageUrl(pubData.metaOgImageUrl) || DEFAULT_PUBLICATION_IMAGE;

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
  }, [apiBase, currentPublication?.id]);

  useEffect(() => {
    loadPublicationData();
  }, [loadPublicationData]);

  const handleImageUpload = async (file, type) => {
    if (uploading) return;

    const targetPublicationId = publicationId || currentPublication?.id;
    if (!targetPublicationId) {
      toast.error("Publication not found");
      return;
    }

    try {
      setUploading(type);
      toast.loading(`Uploading ${getImageTypeLabel(type)}...`, {
        id: IMAGE_UPLOAD_TOAST_ID,
      });

      const formData = new FormData();
      formData.append(
        type === "logo" ? "logo" : type === "favicon" ? "favicon" : "metaOg",
        file,
      );

      const endpoint =
        type === "logo" ? "logo" : type === "favicon" ? "favicon" : "meta-og";
      const res = await fetch(
        `${apiBase}/api/publications/${targetPublicationId}/${endpoint}`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      if (!res.ok) {
        throw new Error(await getUploadErrorMessage(res));
      }

      const data = await res.json();
      const returnedUrl =
        data[
          type === "logo"
            ? "logoUrl"
            : type === "favicon"
              ? "faviconUrl"
              : "metaOgImageUrl"
        ];
      const imageUrl = getImageUrl(returnedUrl) || DEFAULT_PUBLICATION_IMAGE;

      if (type === "logo") {
        setLogo(imageUrl);
        setLogoPreview(imageUrl);
      } else if (type === "favicon") {
        setFavicon(imageUrl);
        setFaviconPreview(imageUrl);
      } else if (type === "meta_og") {
        setMetaOg(imageUrl);
        setMetaOgPreview(imageUrl);
      }

      await refreshCurrentPublication();
      toast.success(`${getImageTypeLabel(type)} updated!`, {
        id: IMAGE_UPLOAD_TOAST_ID,
      });
    } catch (err) {
      console.error("Upload error:", err);
      if (type === "logo") {
        setLogoPreview(logo);
      } else if (type === "favicon") {
        setFaviconPreview(favicon);
      } else if (type === "meta_og") {
        setMetaOgPreview(metaOg);
      }
      toast.error(
        `Failed to upload ${getImageTypeLabel(type)}: ${err.message}`,
        { id: IMAGE_UPLOAD_TOAST_ID },
      );
    } finally {
      setUploading(null);
    }
  };

  const handleSelectedImage = async (file, type, setPreview) => {
    if (!file || uploading) return;

    const validationError = getImageUploadValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    await handleImageUpload(file, type);
  };

  const handleLogoChange = () => {
    if (uploading) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = IMAGE_ACCEPT;
    input.onchange = async (e) => {
      const file = e.target.files[0];
      await handleSelectedImage(file, "logo", setLogoPreview);
    };
    input.click();
  };

  const handleFaviconChange = () => {
    if (uploading) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = IMAGE_ACCEPT;
    input.onchange = async (e) => {
      const file = e.target.files[0];
      await handleSelectedImage(file, "favicon", setFaviconPreview);
    };
    input.click();
  };

  const handleMetaOgChange = () => {
    if (uploading) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = IMAGE_ACCEPT;
    input.onchange = async (e) => {
      const file = e.target.files[0];
      await handleSelectedImage(file, "meta_og", setMetaOgPreview);
    };
    input.click();
  };

  const handleImageRemove = async (type) => {
    if (!publicationId || uploading) return;

    try {
      setUploading(type);
      toast.loading(`Removing ${getImageTypeLabel(type)}...`, {
        id: IMAGE_UPLOAD_TOAST_ID,
      });
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
        setLogo(DEFAULT_PUBLICATION_IMAGE);
        setLogoPreview(DEFAULT_PUBLICATION_IMAGE);
      } else if (type === "favicon") {
        setFavicon(DEFAULT_PUBLICATION_IMAGE);
        setFaviconPreview(DEFAULT_PUBLICATION_IMAGE);
      } else if (type === "meta_og") {
        setMetaOg(DEFAULT_PUBLICATION_IMAGE);
        setMetaOgPreview(DEFAULT_PUBLICATION_IMAGE);
      }

      await refreshCurrentPublication();
      toast.success(`${getImageTypeLabel(type)} removed successfully!`, {
        id: IMAGE_UPLOAD_TOAST_ID,
      });
    } catch (err) {
      toast.error(err.message, { id: IMAGE_UPLOAD_TOAST_ID });
    } finally {
      setUploading(null);
    }
  };

  const handleLogoRemove = () => handleImageRemove("logo");
  const handleFaviconRemove = () => handleImageRemove("favicon");
  const handleMetaOgRemove = () => handleImageRemove("meta_og");

  const handleSave = async () => {
    if (!publicationId) {
      toast.error("Publication not found");
      return;
    }

    try {
      setSaving(true);

      // Validate inputs
      if (!name || name.length < 2 || name.length > 50) {
        throw new Error("Publication name must be between 2 and 50 characters");
      }

      const normalizedSubdomain = normalizeSubdomain(subdomain);
      const subdomainValidation = validateSubdomain(normalizedSubdomain);
      if (!subdomainValidation.valid) {
        throw new Error(subdomainValidation.error);
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
          subdomain: normalizedSubdomain,
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
      toast.error(err.message);
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

          {/* Logo Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-6 mb-3">
              <div
                className={`w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden ${logoPreview === DEFAULT_PUBLICATION_IMAGE || logoPreview.includes(DEFAULT_PUBLICATION_IMAGE) ? "p-4" : ""}`}
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
                  disabled={!!uploading}
                  className="text-purple-500 text-sm hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Logo
                </button>
                <button
                  onClick={handleLogoRemove}
                  disabled={!!uploading}
                  className="text-gray-400 text-sm hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden ${faviconPreview === DEFAULT_PUBLICATION_IMAGE || faviconPreview.includes(DEFAULT_PUBLICATION_IMAGE) ? "p-4" : ""}`}
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
                  disabled={!!uploading}
                  className="text-purple-500 text-sm hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Favicon
                </button>
                <button
                  onClick={handleFaviconRemove}
                  disabled={!!uploading}
                  className="text-gray-400 text-sm hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden ${metaOgPreview === DEFAULT_PUBLICATION_IMAGE || metaOgPreview.includes(DEFAULT_PUBLICATION_IMAGE) ? "p-4" : ""}`}
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
                  disabled={!!uploading}
                  className="text-purple-500 text-sm hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Meta OG
                </button>
                <button
                  onClick={handleMetaOgRemove}
                  disabled={!!uploading}
                  className="text-gray-400 text-sm hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onChange={(e) =>
                  setSubdomain(normalizeSubdomain(e.target.value))
                }
                minLength={3}
                maxLength={63}
                className="flex-1 text-sm focus:outline-none"
              />
              <span className="text-sm text-gray-600">.{getRootDomain()}</span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !!uploading}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors mb-6 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
