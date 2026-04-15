import { parseHost } from "@/utils/hostParser";
import { getApiBase } from "@/utils/apiBase";

const API_URL = getApiBase().replace(/\/$/, "");
const PUBLIC_SITE_REVALIDATE_SECONDS = 30;
const PUBLIC_SITE_FETCH_TIMEOUT_MS = Number(
  process.env.PUBLIC_SITE_FETCH_TIMEOUT_MS || 3500,
);
const PUBLIC_SITE_FETCH_MAX_CONCURRENCY = Number(
  process.env.PUBLIC_SITE_FETCH_MAX_CONCURRENCY || 10,
);

const createConcurrencyLimiter = (maxConcurrent) => {
  let active = 0;
  const queue = [];

  const drain = () => {
    if (active >= maxConcurrent) return;
    const next = queue.shift();
    if (!next) return;
    active += 1;
    next();
  };

  return async (task) => {
    if (active < maxConcurrent) {
      active += 1;
      try {
        return await task();
      } finally {
        active -= 1;
        drain();
      }
    }

    return new Promise((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            active -= 1;
            drain();
          });
      });
    });
  };
};

const runPublicSiteFetch = createConcurrencyLimiter(
  Number.isFinite(PUBLIC_SITE_FETCH_MAX_CONCURRENCY) &&
    PUBLIC_SITE_FETCH_MAX_CONCURRENCY > 0
    ? PUBLIC_SITE_FETCH_MAX_CONCURRENCY
    : 10,
);

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
    const timeoutMs =
      Number.isFinite(PUBLIC_SITE_FETCH_TIMEOUT_MS) &&
      PUBLIC_SITE_FETCH_TIMEOUT_MS > 0
        ? PUBLIC_SITE_FETCH_TIMEOUT_MS
        : 3500;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await runPublicSiteFetch(() =>
        fetch(url, {
          next: { revalidate: PUBLIC_SITE_REVALIDATE_SECONDS },
          signal: controller.signal,
          ...options,
        }),
      );
    } finally {
      clearTimeout(timeout);
    }

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

  const params = new URLSearchParams();
  if (host) {
    params.set("host", host);
  }
  if (hostContext.subdomain) {
    params.set("subdomain", hostContext.subdomain);
  }
  if (hostContext.customDomain) {
    params.set("customDomain", hostContext.customDomain);
  }
  if (publicationId) {
    params.set("publicationId", publicationId);
  }

  const routing = await fetchJson(
    `${API_URL}/api/publications/resolve-host?${params.toString()}`,
  );

  return {
    hostContext: routing?.hostContext || hostContext,
    publication: routing?.publication || null,
    publicationId: routing?.publicationId || publicationId,
  };
};
