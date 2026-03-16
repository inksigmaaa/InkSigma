const DEFAULT_ROOT_DOMAIN = "localhost";
const DEFAULT_MAIN_DOMAIN = "inksigma.com";
const DEV_APP_PORT = "3000";

const normalizeValue = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

export const getLocalCustomDomainAlias = (customDomain) => {
  const normalized = normalizeValue(customDomain);
  if (!normalized) return "";

  const label = normalized.split(".")[0];
  return label ? `${label}.local` : "";
};

export const getRootDomain = () =>
  normalizeValue(process.env.NEXT_PUBLIC_ROOT_DOMAIN) || DEFAULT_ROOT_DOMAIN;

export const getMainDomain = () =>
  normalizeValue(process.env.NEXT_PUBLIC_MAIN_DOMAIN) || DEFAULT_MAIN_DOMAIN;

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

  if (process.env.NODE_ENV === "development") {
    return `${normalizedSubdomain}.${getRootDomain()}`;
  }

  return `${normalizedSubdomain}.${getMainDomain()}`;
};

export const getPublicationHost = (publication) => {
  const customDomain = normalizeValue(publication?.customDomain);
  if (customDomain) {
    if (process.env.NODE_ENV === "development") {
      return getLocalCustomDomainAlias(customDomain) || customDomain;
    }
    return customDomain;
  }
  return getSubdomainHost(publication?.subdomain);
};

export const getPublicationUrl = (publication) => {
  const host = getPublicationHost(publication);
  if (!host) return "";

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol || "http:";
    const port =
      window.location.port ||
      (process.env.NODE_ENV === "development" ? DEV_APP_PORT : "");
    const portSuffix =
      process.env.NODE_ENV === "development" || isLocalLikeHost(host)
        ? `:${port || DEV_APP_PORT}`
        : "";

    return `${protocol}//${host}${portSuffix}`;
  }

  if (process.env.NODE_ENV === "development" || isLocalLikeHost(host)) {
    return `http://${host}:${DEV_APP_PORT}`;
  }

  return `https://${host}`;
};

export const getPublicationDomainLabel = (publication) =>
  normalizeValue(publication?.customDomain) ||
  getSubdomainHost(publication?.subdomain);

export const getSubdomainDomainLabel = (subdomain) =>
  getSubdomainHost(subdomain);
