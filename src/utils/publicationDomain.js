const DEFAULT_ROOT_DOMAIN = "localhost";
const DEFAULT_MAIN_DOMAIN = "inksigma.com";
const DEV_APP_PORT = "3000";

const normalizeValue = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

export const hasActiveCustomDomain = (publication) =>
  Boolean(normalizeValue(publication?.customDomain)) &&
  normalizeValue(publication?.customDomainStatus) === "active";

export const getLocalCustomDomainAlias = (customDomain) => {
  const normalized = normalizeValue(customDomain);
  if (!normalized) return "";

  const label = normalized.split(".")[0];
  return label ? `${label}.local` : "";
};

export const getRootDomain = () =>
  normalizeValue(process.env.NEXT_PUBLIC_ROOT_DOMAIN) || DEFAULT_ROOT_DOMAIN;

export const getMainDomain = () =>
  isLocalLikeHost(getRootDomain())
    ? getRootDomain()
    : normalizeValue(process.env.NEXT_PUBLIC_MAIN_DOMAIN) || DEFAULT_MAIN_DOMAIN;

const deriveRootDomainFromWindowHost = () => {
  if (typeof window === "undefined") return "";

  const hostname = normalizeValue(window.location.hostname);
  if (!hostname) return "";

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }

  const parts = hostname.split(".");
  if (parts.length < 2) return "";

  if (parts[0] === "dashboard" && parts.length >= 3) {
    return parts.slice(1).join(".");
  }

  return parts.slice(1).join(".");
};

const getEffectiveRootDomain = () => {
  const envRoot = getRootDomain();
  const derivedRoot = deriveRootDomainFromWindowHost();

  if (derivedRoot && isLocalLikeHost(derivedRoot)) {
    return derivedRoot;
  }

  return envRoot;
};

const isRootDomainLocalLike = () => isLocalLikeHost(getRootDomain());

const shouldPreferRootDomain = () => {
  if (isRootDomainLocalLike()) return true;

  if (typeof window !== "undefined") {
    return isLocalLikeHost(window.location.hostname);
  }

  return process.env.NODE_ENV !== "production";
};

export const isLocalLikeHost = (host) => {
  const normalized = normalizeValue(host);
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  );
};

export const getSubdomainHost = (subdomain) => {
  const normalizedSubdomain = normalizeValue(subdomain);
  if (!normalizedSubdomain) return "";

  const effectiveRootDomain = getEffectiveRootDomain();

  if (shouldPreferRootDomain()) {
    return `${normalizedSubdomain}.${effectiveRootDomain}`;
  }

  return `${normalizedSubdomain}.${getMainDomain()}`;
};

export const getPublicationHost = (publication) => {
  const subdomainHost = getSubdomainHost(publication?.subdomain);

  if (shouldPreferRootDomain() && subdomainHost) {
    return subdomainHost;
  }

  const customDomain = hasActiveCustomDomain(publication)
    ? normalizeValue(publication?.customDomain)
    : "";
  if (customDomain) {
    if (shouldPreferRootDomain()) {
      return getLocalCustomDomainAlias(customDomain) || customDomain;
    }
    return customDomain;
  }
  return subdomainHost;
};

export const getPublicationUrl = (publication) => {
  if (typeof window !== "undefined") {
    const currentHostname = normalizeValue(window.location.hostname);
    const localRuntime = isLocalLikeHost(currentHostname);
    const publicationSubdomain = normalizeValue(publication?.subdomain);

    // In local dev a publication is always reachable at its subdomain on the dev
    // root domain (e.g. tennyson.inksigma.local). Use ONLY the real subdomain —
    // never the custom-domain label. Deriving the host from `customDomain` kept
    // "view site" pointed at a custom-domain-shaped host even after the custom
    // domain was reverted/detached (the label is not gated on
    // hasActiveCustomDomain), so reverting to the subdomain had no effect here.
    if (localRuntime && publicationSubdomain) {
      const protocol = window.location.protocol || "http:";
      const port = window.location.port || DEV_APP_PORT;
      const rootDomain = getEffectiveRootDomain() || getRootDomain() || "localhost";
      return `${protocol}//${publicationSubdomain}.${rootDomain}:${port}`;
    }
  }

  const host = getPublicationHost(publication);
  if (!host) return "";

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol || "http:";
    const port =
      window.location.port ||
      (process.env.NODE_ENV === "development" ? DEV_APP_PORT : "");
    const portSuffix =
      shouldPreferRootDomain() || isLocalLikeHost(host)
        ? `:${port || DEV_APP_PORT}`
        : "";

    return `${protocol}//${host}${portSuffix}`;
  }

  if (shouldPreferRootDomain() || isLocalLikeHost(host)) {
    return `http://${host}:${DEV_APP_PORT}`;
  }

  return `https://${host}`;
};

export const getPublicationPageUrl = (publication, pathname = "/") => {
  const baseUrl = getPublicationUrl(publication);
  if (!baseUrl) return "";

  try {
    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return new URL(normalizedPath, `${baseUrl}/`).toString();
  } catch {
    return baseUrl;
  }
};

// Canonical "view site" href: the public blog index (`/blog`) on the tenant's
// subdomain or active custom domain (and the matching host in local dev).
// Falls back to a relative `/blog` link — carrying publicationId so the
// dashboard host can still resolve the tenant — when no absolute publication
// URL can be derived (e.g. SSR, or a publication without a subdomain).
export const getPublicationSiteHref = (publication) => {
  const url = getPublicationPageUrl(publication, "/blog");
  if (url) return url;

  return publication?.id
    ? `/blog?publicationId=${encodeURIComponent(publication.id)}`
    : "/blog";
};

export const getSubdomainDomainLabel = (subdomain) =>
  getSubdomainHost(subdomain);
