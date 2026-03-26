import { parseHost } from "@/utils/hostParser";

const API_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");
const PUBLIC_SITE_REVALIDATE_SECONDS = 30;

export const normalizeSearchParamsRecord = (searchParams) => {
  if (!searchParams) return {};

  if (
    typeof searchParams?.entries === "function" &&
    typeof searchParams?.get === "function"
  ) {
    const record = {};
    for (const [key, value] of searchParams.entries()) {
      if (record[key] === undefined) {
        record[key] = value;
      } else if (Array.isArray(record[key])) {
        record[key].push(value);
      } else {
        record[key] = [record[key], value];
      }
    }
    return record;
  }

  return searchParams;
};

const toSearchParamRecord = async (searchParams) => {
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  return normalizeSearchParamsRecord(resolved || {});
};

const getParamValue = (params, key) => {
  const value = params?.[key];
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return typeof value === "string" && value.trim() ? value : null;
};

const fetchJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      next: { revalidate: PUBLIC_SITE_REVALIDATE_SECONDS },
      ...options,
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export const resolvePublicSiteHostContext = async ({ host, searchParams }) => {
  const resolvedSearchParams = await toSearchParamRecord(searchParams);
  const subdomain = getParamValue(resolvedSearchParams, "subdomain");
  const customDomain = getParamValue(resolvedSearchParams, "customDomain");

  if (subdomain || customDomain) {
    return {
      subdomain,
      customDomain,
    };
  }

  const parsed = parseHost(host || "");

  return {
    subdomain:
      parsed.isCustomDomain || parsed.isDashboard ? null : parsed.subdomain || null,
    customDomain: parsed.isCustomDomain ? parsed.hostname : null,
  };
};

export const getTenantHeadersForResolvedContext = ({ hostContext, host }) => {
  const resolvedHostContext = hostContext || {
    subdomain: null,
    customDomain: null,
  };

  if (resolvedHostContext.customDomain) {
    return { "X-Custom-Domain": resolvedHostContext.customDomain };
  }

  if (resolvedHostContext.subdomain) {
    return { "X-Subdomain": resolvedHostContext.subdomain };
  }

  const parsed = parseHost(host || "");

  if (parsed.isCustomDomain && parsed.hostname) {
    return { "X-Custom-Domain": parsed.hostname };
  }

  if (parsed.subdomain && !parsed.isDashboard) {
    return { "X-Subdomain": parsed.subdomain };
  }

  return {};
};

export const resolvePublicSiteContext = async ({ host, searchParams }) => {
  const resolvedSearchParams = await toSearchParamRecord(searchParams);
  const hostContext = await resolvePublicSiteHostContext({
    host,
    searchParams: resolvedSearchParams,
  });
  const publicationId = getParamValue(resolvedSearchParams, "publicationId");

  let publication = null;

  if (hostContext.customDomain) {
    publication = await fetchJson(
      `${API_URL}/api/publications/by-custom-domain/${encodeURIComponent(hostContext.customDomain)}`,
    );
  }

  if (!publication && hostContext.subdomain) {
    publication = await fetchJson(
      `${API_URL}/api/publications/by-subdomain/${encodeURIComponent(hostContext.subdomain)}`,
    );
  }

  if (!publication && publicationId) {
    publication = await fetchJson(
      `${API_URL}/api/publications/${encodeURIComponent(publicationId)}`,
    );
  }

  if (!publication && host) {
    const routing = await fetchJson(
      `${API_URL}/api/publications/resolve-host?host=${encodeURIComponent(host)}`,
    );
    if (routing?.publication) {
      publication = routing.publication;
    }
  }

  return {
    hostContext,
    publication,
    publicationId,
  };
};
