import { parseHost } from "@/utils/hostParser";

const RESERVED_SUBDOMAINS = new Set(["dashboard", "www", "api"]);

const getRootDomain = () =>
  (process.env.NEXT_PUBLIC_ROOT_DOMAIN || (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost")).toLowerCase();

export const getDashboardOrigin = () => {
  // Same-origin mode: dashboard lives on the same domain (path-based routing)
  if (process.env.NEXT_PUBLIC_SAME_ORIGIN_DASHBOARD === "true") {
    if (typeof window !== "undefined") return window.location.origin;
    return process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://inksigma.xyz" : "http://localhost:3000");
  }

  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production" ? "https://dashboard.inksigma.xyz" : "http://dashboard.localhost:3000";
  }

  const rootDomain = getRootDomain();
  const desiredHost =
    rootDomain === "localhost"
      ? "dashboard.localhost"
      : `dashboard.${rootDomain}`;
  const port = window.location.port ? `:${window.location.port}` : "";

  return `${window.location.protocol}//${desiredHost}${port}`;
};

const applyTenantContext = (url, { publicationId } = {}) => {
  if (typeof window === "undefined") {
    return url;
  }

  const currentParams = new URLSearchParams(window.location.search);
  const parsedHost = parseHost(window.location.host);

  currentParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  if (publicationId) {
    url.searchParams.set("publicationId", String(publicationId));
  }

  if (parsedHost.isCustomDomain && parsedHost.hostname) {
    url.searchParams.set("customDomain", parsedHost.hostname);
    url.searchParams.delete("subdomain");
    return url;
  }

  if (
    parsedHost.subdomain &&
    !RESERVED_SUBDOMAINS.has(parsedHost.subdomain)
  ) {
    url.searchParams.set("subdomain", parsedHost.subdomain);
    url.searchParams.delete("customDomain");
  }

  return url;
};

export const buildDashboardViewSiteUrl = ({
  pathname,
  publicationId,
} = {}) => {
  const dashboardUrl = new URL(
    pathname ||
      (typeof window !== "undefined" &&
      window.location.pathname.startsWith("/view-site")
        ? window.location.pathname
        : `/view-site${
            typeof window !== "undefined" ? window.location.pathname : ""
          }`),
    getDashboardOrigin(),
  );

  return applyTenantContext(dashboardUrl, { publicationId }).toString();
};

export const buildDashboardLoginUrlForViewSite = ({
  pathname,
  publicationId,
} = {}) => {
  const loginUrl = new URL("/login", getDashboardOrigin());
  loginUrl.searchParams.set(
    "returnTo",
    buildDashboardViewSiteUrl({ pathname, publicationId }),
  );
  return loginUrl.toString();
};

export const buildDashboardEditorRedirectPath = ({ publicationId } = {}) => {
  const params = new URLSearchParams();

  if (publicationId) {
    params.set("publicationId", String(publicationId));
  }

  const queryString = params.toString();
  return queryString ? `/editor?${queryString}` : "/editor";
};

export const buildDashboardLoginUrlForEditor = ({ publicationId } = {}) => {
  const loginUrl = new URL("/login", getDashboardOrigin());
  loginUrl.searchParams.set(
    "redirect",
    buildDashboardEditorRedirectPath({ publicationId }),
  );
  return loginUrl.toString();
};

export const redirectToDashboardEditor = ({ publicationId } = {}) => {
  if (typeof window === "undefined") return;

  window.location.assign(buildDashboardLoginUrlForEditor({ publicationId }));
};
