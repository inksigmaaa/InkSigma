import { parseHost } from "@/utils/hostParser";

export const getBlogPath = (slug, pathname = "", publicationId = null) => {
  if (!slug) {
    return "";
  }

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
