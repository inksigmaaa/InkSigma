import { parseHost } from "@/utils/hostParser";
import { getPublicationPageUrl } from "@/utils/publicationDomain";

const API_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const normalizeSearchParams = async (searchParams) =>
  searchParams ? await Promise.resolve(searchParams) : {};

export const getAbsoluteAssetUrl = (assetPath) => {
  if (!assetPath) return "";
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  return `${API_URL}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
};

export const getTenantHeadersForHost = (host) => {
  if (!host) return {};

  const parsed = parseHost(host);

  if (parsed.isDashboard || parsed.isRootDomain) {
    return {};
  }

  if (parsed.isCustomDomain && parsed.hostname) {
    return { "X-Custom-Domain": parsed.hostname };
  }

  if (parsed.subdomain && !["dashboard", "www", "api"].includes(parsed.subdomain)) {
    return { "X-Subdomain": parsed.subdomain };
  }

  return {};
};

export const getRequestHost = (headerList) =>
  headerList?.get?.("x-forwarded-host") ||
  headerList?.get?.("host") ||
  "";

export const fetchPublicationForMetadata = async ({
  host,
  searchParams,
}) => {
  const resolvedSearchParams = await normalizeSearchParams(searchParams);
  const subdomain = resolvedSearchParams?.subdomain || null;
  const customDomain = resolvedSearchParams?.customDomain || null;
  const publicationId = resolvedSearchParams?.publicationId || null;

  try {
    if (customDomain) {
      const response = await fetch(
        `${API_URL}/api/publications/by-custom-domain/${encodeURIComponent(customDomain)}`,
        { cache: "no-store" },
      );
      if (response.ok) return response.json();
    }

    if (subdomain) {
      const response = await fetch(
        `${API_URL}/api/publications/by-subdomain/${encodeURIComponent(subdomain)}`,
        { cache: "no-store" },
      );
      if (response.ok) return response.json();
    }

    if (publicationId) {
      const response = await fetch(`${API_URL}/api/publications/${publicationId}`, {
        cache: "no-store",
      });
      if (response.ok) return response.json();
    }

    if (host) {
      const routingResponse = await fetch(
        `${API_URL}/api/publications/resolve-host?host=${encodeURIComponent(host)}`,
        { cache: "no-store" },
      );

      if (routingResponse.ok) {
        const routing = await routingResponse.json();
        if (routing?.publication) {
          return routing.publication;
        }
      }

      const parsed = parseHost(host);
      if (parsed.isCustomDomain && parsed.hostname) {
        const response = await fetch(
          `${API_URL}/api/publications/by-custom-domain/${encodeURIComponent(parsed.hostname)}`,
          { cache: "no-store" },
        );
        if (response.ok) return response.json();
      }

      if (parsed.subdomain && !parsed.isDashboard) {
        const response = await fetch(
          `${API_URL}/api/publications/by-subdomain/${encodeURIComponent(parsed.subdomain)}`,
          { cache: "no-store" },
        );
        if (response.ok) return response.json();
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const fetchPublishedBlogsForSitemap = async ({ publicationId }) => {
  if (!publicationId) return [];

  try {
    const response = await fetch(
      `${API_URL}/api/blogs?publicationId=${publicationId}&status=published`,
      {
        cache: "no-store",
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

export const fetchBlogForMetadata = async ({ host, slug }) => {
  if (!slug) return null;

  try {
    const response = await fetch(`${API_URL}/api/blogs/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      headers: getTenantHeadersForHost(host),
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
  const resolvedImage =
    getAbsoluteAssetUrl(
      image ||
        publication.metaOgImageUrl ||
        publication.logoUrl ||
        publication.faviconUrl,
    ) || undefined;
  const iconUrl = getAbsoluteAssetUrl(publication.faviconUrl) || undefined;

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
    icons: iconUrl
      ? {
          icon: iconUrl,
        }
      : undefined,
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
