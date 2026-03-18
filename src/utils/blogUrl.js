export const getBlogPath = (slug, pathname = "") => {
  if (!slug) {
    return "";
  }

  const currentPath =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "/view-site");
  const basePath = currentPath.startsWith("/view-site") ? "/view-site" : "";

  return `${basePath}/blog/${encodeURIComponent(slug)}`;
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
