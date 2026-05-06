/**
 * Returns the absolute URL for a dashboard path.
 *
 * In development (localhost / *.local), returns a relative path so the
 * app works without needing real subdomains.
 * In production, returns the full https://dashboard.<rootDomain> URL so
 * links on inksigma.xyz correctly navigate to dashboard.inksigma.xyz.
 */
const getDomainHostname = (domain = "") =>
  String(domain)
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();

const getDomainPort = (domain = "") => {
  const hostWithPort = String(domain)
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0];
  const port = hostWithPort.split(":")[1];
  return port || "";
};

export const isLocalDashboardDomain = (domain = "") => {
  const hostname = getDomainHostname(domain);
  return (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".localhost")
  );
};

export const getLocalDashboardOrigin = (domain = "") => {
  const rootHostname = getDomainHostname(domain) || "localhost";
  const dashboardHost =
    rootHostname === "localhost"
      ? "dashboard.localhost"
      : `dashboard.${rootHostname}`;

  if (typeof window !== "undefined") {
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${window.location.protocol}//${dashboardHost}${port}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const protocol = appUrl.startsWith("https://") ? "https:" : "http:";
  const port = getDomainPort(appUrl) || getDomainPort(domain);
  return `${protocol}//${dashboardHost}${port ? `:${port}` : ""}`;
};

export const getDashboardUrl = (path = "") => {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (process.env.NEXT_PUBLIC_SAME_ORIGIN_DASHBOARD === "true") {
    return path || "/";
  }

  if (isLocalDashboardDomain(rootDomain)) {
    return `${getLocalDashboardOrigin(rootDomain)}${cleanPath}`;
  }

  return `https://dashboard.${rootDomain}${cleanPath}`;
};

export const withPublicationPath = (path = "/", publication) => {
  if (!path || typeof path !== "string" || !path.startsWith("/")) {
    return path;
  }

  const subdomain =
    typeof publication === "string" ? publication : publication?.subdomain;

  if (!subdomain) {
    return path;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.toLowerCase();
    const isDashboardHost =
      hostname === "dashboard.localhost" ||
      hostname.startsWith("dashboard.");

    if (!isDashboardHost) {
      return path;
    }
  }

  if (path === `/${subdomain}` || path.startsWith(`/${subdomain}/`)) {
    return path;
  }

  return `/${subdomain}${path}`;
};
