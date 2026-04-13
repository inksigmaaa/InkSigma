/**
 * Returns the absolute URL for a dashboard path.
 *
 * In development (localhost / *.local), returns a relative path so the
 * app works without needing real subdomains.
 * In production, returns the full https://dashboard.<rootDomain> URL so
 * links on inksigma.xyz correctly navigate to dashboard.inksigma.xyz.
 */
export const getDashboardUrl = (path = "") => {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

  const isLocal =
    rootDomain === "localhost" ||
    rootDomain.endsWith(".local") ||
    rootDomain.endsWith(".localhost");

  if (isLocal) {
    return path || "/";
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `https://dashboard.${rootDomain}${cleanPath}`;
};
