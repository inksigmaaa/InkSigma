export const DEFAULT_ROOT_DOMAIN = "localhost";
export const DEFAULT_BASE_DOMAINS = "localhost,inksigma.local";
export const DEFAULT_MAIN_DOMAIN = "inksigma.xyz";
export const DEFAULT_DASHBOARD_SUBDOMAIN = "dashboard";

const normalizeConfiguredDomain = (value: string | null | undefined): string => {
  if (!value) return "";

  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed) return "";

  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0];
  const withoutPort = withoutPath.replace(/:\d+$/, "");

  return withoutPort.replace(/^\.+/, "");
};

export const parseConfiguredDomains = (value: string | undefined): string[] =>
  Array.from(
    new Set(
      (value || "")
        .split(",")
        .map((entry) => normalizeConfiguredDomain(entry))
        .filter(Boolean),
    ),
  );

export const normalizeConfiguredDomainValue = normalizeConfiguredDomain;

export const isLocalLikeDomain = (value: string | null | undefined) => {
  const normalized = normalizeConfiguredDomain(value);
  return (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".localhost")
  );
};

export const getConfiguredRootDomain = () =>
  normalizeConfiguredDomainValue(
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN,
  ) || DEFAULT_ROOT_DOMAIN;

export const getConfiguredMainDomain = () => {
  const rootDomain = getConfiguredRootDomain();

  if (isLocalLikeDomain(rootDomain)) {
    return rootDomain;
  }

  return (
    normalizeConfiguredDomainValue(
      process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN,
    ) || DEFAULT_MAIN_DOMAIN
  );
};

export const getConfiguredBaseDomains = () =>
  Array.from(
    new Set(
      parseConfiguredDomains(
        process.env.BASE_DOMAINS ||
          process.env.BASE_DOMAIN ||
          process.env.NEXT_PUBLIC_BASE_DOMAINS ||
          process.env.NEXT_PUBLIC_BASE_DOMAIN ||
          DEFAULT_BASE_DOMAINS,
      ).concat(getConfiguredRootDomain(), getConfiguredMainDomain()),
    ),
  );

export const getConfiguredDashboardSubdomain = () =>
  normalizeConfiguredDomainValue(
    process.env.DASHBOARD_SUBDOMAIN || process.env.NEXT_PUBLIC_DASHBOARD_SUBDOMAIN,
  ) || DEFAULT_DASHBOARD_SUBDOMAIN;
