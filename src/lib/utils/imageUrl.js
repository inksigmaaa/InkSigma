import { getApiBase } from "@/utils/apiBase";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const PROTOCOL_RELATIVE_PATTERN = /^\/\//;
const CLOUDINARY_HOST_PATTERN = /^res\.cloudinary\.com\//i;
const DATA_IMAGE_PATTERN = /^data:image\//i;
const LEGACY_UPLOAD_PATH_PATTERN = /^\/?uploads\//i;
const INVALID_IMAGE_VALUES = new Set(["", "null", "undefined"]);

const stripWrappingQuotes = (value) => value.replace(/^['"]+|['"]+$/g, "");
const getBackendOrigin = () =>
  (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    getApiBase()
  ).replace(/\/$/, "");

export const getImageUrl = (imagePath) => {
  if (typeof imagePath !== "string") return null;

  const normalizedPath = stripWrappingQuotes(imagePath.trim());
  if (!normalizedPath) return null;

  const normalizedKey = normalizedPath.toLowerCase();
  if (INVALID_IMAGE_VALUES.has(normalizedKey)) {
    return null;
  }

  if (ABSOLUTE_URL_PATTERN.test(normalizedPath)) {
    return normalizedPath;
  }

  if (PROTOCOL_RELATIVE_PATTERN.test(normalizedPath)) {
    return `https:${normalizedPath}`;
  }

  if (CLOUDINARY_HOST_PATTERN.test(normalizedPath)) {
    return `https://${normalizedPath}`;
  }

  if (DATA_IMAGE_PATTERN.test(normalizedPath)) {
    return normalizedPath;
  }

  if (LEGACY_UPLOAD_PATH_PATTERN.test(normalizedPath)) {
    const pathWithLeadingSlash = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
    return `${getBackendOrigin()}${pathWithLeadingSlash}`;
  }

  return null;
};

export const getCloudinaryThumbnail = (
  url,
  { width = 400, height = 300, crop = "fill" } = {},
) => {
  const normalizedUrl = getImageUrl(url);
  if (!normalizedUrl || !normalizedUrl.includes("res.cloudinary.com")) {
    return normalizedUrl;
  }

  return normalizedUrl.replace(
    "/upload/",
    `/upload/w_${width},h_${height},c_${crop},f_auto,q_auto/`,
  );
};
