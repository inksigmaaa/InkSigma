import {
  getConfiguredMainDomain,
  getConfiguredRootDomain,
  isLocalLikeHost,
} from "@/utils/domainConfig";

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

export const getRootDomain = () => getConfiguredRootDomain();

export const getMainDomain = () => getConfiguredMainDomain();

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
    const customDomainLabel = normalizeValue(publication?.customDomain)
      .split(".")
      .filter(Boolean)[0];
    const resolvedSubdomain = publicationSubdomain || customDomainLabel;

    if (localRuntime && resolvedSubdomain) {
      const protocol = window.location.protocol || "http:";
      const port = window.location.port || DEV_APP_PORT;
      const rootDomain = getEffectiveRootDomain() || getRootDomain() || "localhost";
      return `${protocol}//${resolvedSubdomain}.${rootDomain}:${port}`;
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

export const getSubdomainDomainLabel = (subdomain) =>
  getSubdomainHost(subdomain);
