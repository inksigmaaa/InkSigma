import { getPublicationPageUrl } from "@/utils/publicationDomain";
import {
  getTenantHeadersForResolvedContext,
  resolvePublicSiteContext,
} from "@/utils/publicSiteContext";
import { getImageUrl } from "@/lib/utils/imageUrl";

const API_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");
const PUBLIC_METADATA_REVALIDATE_SECONDS = 30;
const DEFAULT_SITE_ICON = "/favicon.ico";
const DEFAULT_SITE_SHORTCUT_ICON = "/favicon.ico";
const DEFAULT_SITE_PNG_ICON = "/icons/favicon-32x32.png";
const DEFAULT_SITE_SVG_ICON = "/icons/favicon.svg";
const DEFAULT_SITE_APPLE_ICON = "/icons/apple-touch-icon.png";

export const getAbsoluteAssetUrl = (assetPath) => {
  return getImageUrl(assetPath) || "";
};

export const getRequestHost = (headerList) =>
  headerList?.get?.("x-forwarded-host") ||
  headerList?.get?.("host") ||
  "";

export const fetchPublicationForMetadata = async ({
  host,
  searchParams,
}) => {
  const context = await resolvePublicSiteContext({ host, searchParams });
  return context.publication || null;
};

export const fetchPublishedBlogsForSitemap = async ({ publicationId }) => {
  if (!publicationId) return [];

  try {
    const response = await fetch(
      `${API_URL}/api/blogs?publicationId=${publicationId}&status=published`,
      {
        next: { revalidate: PUBLIC_METADATA_REVALIDATE_SECONDS },
      },
    );

    if (!response.ok) {
      return [];
    }

    const blogs = await response.json();
    return Array.isArray(blogs) ? blogs : [];
  } catch {
    return [];
  }
};

export const fetchBlogForMetadata = async ({ host, slug, searchParams }) => {
  if (!slug) return null;

  try {
    const { hostContext } = await resolvePublicSiteContext({
      host,
      searchParams,
    });
    const response = await fetch(`${API_URL}/api/blogs/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: PUBLIC_METADATA_REVALIDATE_SECONDS },
      headers: getTenantHeadersForResolvedContext({ hostContext, host }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export const buildPublicationMetadata = ({
  publication,
  pathname = "/",
  title,
  description,
  image,
  type = "website",
}) => {
  if (!publication) {
    return {};
  }

  const canonical = getPublicationPageUrl(publication, pathname);
  const resolvedTitle =
    title || publication.name || "InkSigma Publication";
  const resolvedDescription =
    description ||
    publication.description ||
    "Read the latest writing from this publication on InkSigma.";
  const rawImage = getAbsoluteAssetUrl(
    image ||
      publication.metaOgImageUrl ||
      publication.logoUrl ||
      publication.faviconUrl,
  ) || undefined;
  // Serve OG images at exact social sharing dimensions via Cloudinary transforms
  const resolvedImage = rawImage?.includes("res.cloudinary.com")
    ? rawImage.replace("/upload/", "/upload/w_1200,h_630,c_fill,f_auto,q_auto/")
    : rawImage;
  const rawIconUrl =
    getAbsoluteAssetUrl(publication.faviconUrl) || undefined;
  // Serve favicon at standard browser size via Cloudinary transforms
  const publicationIconUrl = rawIconUrl?.includes("res.cloudinary.com")
    ? rawIconUrl.replace("/upload/", "/upload/w_32,h_32,c_fill,f_png/")
    : rawIconUrl;
  const resolvedIcon = publicationIconUrl
    ? publicationIconUrl
    : [
        { url: DEFAULT_SITE_ICON, type: "image/x-icon" },
        {
          url: DEFAULT_SITE_PNG_ICON,
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: DEFAULT_SITE_SVG_ICON,
          type: "image/svg+xml",
        },
      ];
  const resolvedShortcutIconUrl = publicationIconUrl || DEFAULT_SITE_SHORTCUT_ICON;
  const resolvedAppleIconUrl = publicationIconUrl || DEFAULT_SITE_APPLE_ICON;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    openGraph: {
      type,
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonical || undefined,
      siteName: publication.name || "InkSigma",
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      card: resolvedImage ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description: resolvedDescription,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
    icons: {
      icon: resolvedIcon,
      shortcut: resolvedShortcutIconUrl,
      apple: resolvedAppleIconUrl,
    },
  };
};

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const buildSitemapXml = (entries = []) => {
  const urls = entries
    .filter((entry) => entry?.url)
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${escapeXml(entry.lastModified)}</lastmod>`
        : "";
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
};
