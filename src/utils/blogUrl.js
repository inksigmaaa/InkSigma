import { parseHost } from "@/utils/hostParser";

// Resolve the path prefix the public site is served under for the current
// request. On a tenant host (subdomain / custom domain) the URLs are clean
// (`/blog/...`); on the dashboard host the public site is rendered under
// `/view-site/...`, so links must keep that prefix.
const getBlogBasePath = (pathname = "") => {
  const currentPath =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "/view-site");

  let basePath = currentPath.startsWith("/view-site") ? "/view-site" : "";

  if (typeof window !== "undefined") {
    const parsedHost = parseHost(window.location.host);
    if (parsedHost.isDashboard) {
      basePath = "/view-site";
    }
  }

  return basePath;
};

export const getBlogPath = (slug, pathname = "", publicationId = null) => {
  if (!slug) {
    return "";
  }

  const basePath = getBlogBasePath(pathname);
  const path = `${basePath}/blog/${encodeURIComponent(slug)}`;

  // On the dashboard/main host there is no tenant in the hostname, so the
  // publication can only be resolved from the `publicationId` query param.
  // Preserve it through blog links — otherwise navigating "home" from a post
  // (header logo / back button read the id from the URL) lands on a
  // publication-less view site with a blank header.
  if (publicationId && basePath === "/view-site") {
    return `${path}?publicationId=${encodeURIComponent(publicationId)}`;
  }

  return path;
};

// The blog listing (index) path. The public site's canonical home is the blog
// index, so "view site" / "back to blog" actions point here. On a tenant host
// this is a clean `/blog`; on the dashboard host the publication is carried via
// the `publicationId` query param (same reasoning as getBlogPath).
export const getBlogIndexPath = (pathname = "", publicationId = null) => {
  const basePath = getBlogBasePath(pathname);
  const path = `${basePath}/blog`;

  if (publicationId && basePath === "/view-site") {
    return `${path}?publicationId=${encodeURIComponent(publicationId)}`;
  }

  return path;
};

export const getBlogUrl = (slug, pathname = "", origin = "") => {
  const path = getBlogPath(slug, pathname);
  if (!path) {
    return "";
  }

  const resolvedOrigin =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return resolvedOrigin ? `${resolvedOrigin}${path}` : path;
};
