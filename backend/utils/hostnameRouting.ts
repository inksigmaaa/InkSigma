import {
  getConfiguredBaseDomains,
  getConfiguredDashboardSubdomain,
  getConfiguredMainDomain,
} from "./domainConfig.js";

export const DASHBOARD_SUBDOMAIN = getConfiguredDashboardSubdomain();
export const MAIN_DOMAIN = getConfiguredMainDomain();
export const BASE_DOMAINS = getConfiguredBaseDomains();

export const RESERVED_SUBDOMAINS = new Set([
  "dashboard",
  "www",
  "api",
  "admin",
  "static",
  "assets",
  "cdn",
  "mail",
  "support",
  "help",
  "status",
]);

export const normalizeHost = (rawHost: string | null | undefined) => {
  if (!rawHost) return "";

  const trimmed = String(rawHost).trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0];

  if (withoutPath.startsWith("[")) {
    return withoutPath.slice(1).split("]")[0].toLowerCase();
  }

  return withoutPath.split(":")[0];
};

export const classifyHostForRouting = (host: string | null | undefined) => {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return {
      host: "",
      kind: null,
      value: "",
      isRootDomain: false,
      isDashboard: false,
      isReservedSubdomain: false,
      isCustomDomain: false,
    };
  }

  const candidateBaseDomains = [...BASE_DOMAINS, MAIN_DOMAIN]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const baseDomain of candidateBaseDomains) {
    if (normalizedHost === baseDomain) {
      return {
        host: normalizedHost,
        kind: null,
        value: "",
        isRootDomain: true,
        isDashboard: false,
        isReservedSubdomain: false,
        isCustomDomain: false,
      };
    }

    const suffix = `.${baseDomain}`;
    if (!normalizedHost.endsWith(suffix)) {
      continue;
    }

    const subdomain = normalizedHost.slice(0, -suffix.length);
    return {
      host: normalizedHost,
      kind: "subdomain",
      value: subdomain,
      isRootDomain: false,
      isDashboard: subdomain === DASHBOARD_SUBDOMAIN,
      isReservedSubdomain: RESERVED_SUBDOMAINS.has(subdomain),
      isCustomDomain: false,
    };
  }

  return {
    host: normalizedHost,
    kind: "custom_domain",
    value: normalizedHost,
    isRootDomain: false,
    isDashboard: false,
    isReservedSubdomain: false,
    isCustomDomain: true,
  };
};
