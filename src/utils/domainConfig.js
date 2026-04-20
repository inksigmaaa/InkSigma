export const DEFAULT_ROOT_DOMAIN = 'localhost';
export const DEFAULT_BASE_DOMAINS = 'localhost,inksigma.local';
export const DEFAULT_MAIN_DOMAIN = 'inksigma.xyz';
export const DEFAULT_DASHBOARD_SUBDOMAIN = 'dashboard';

export const normalizeConfiguredDomain = (value) => {
  if (!value) return '';

  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed) return '';

  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//, '');
  const withoutPath = withoutProtocol.split('/')[0];
  const withoutPort = withoutPath.replace(/:\d+$/, '');

  return withoutPort.replace(/^\.+/, '');
};

export const parseConfiguredDomains = (value) =>
  Array.from(
    new Set(
      String(value || '')
        .split(',')
        .map((entry) => normalizeConfiguredDomain(entry))
        .filter(Boolean),
    ),
  );

export const isLocalLikeHost = (host) => {
  const normalized = normalizeConfiguredDomain(host);
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local')
  );
};

export const getConfiguredRootDomain = () =>
  normalizeConfiguredDomain(process.env.NEXT_PUBLIC_ROOT_DOMAIN) ||
  DEFAULT_ROOT_DOMAIN;

export const getConfiguredMainDomain = () => {
  const rootDomain = getConfiguredRootDomain();

  if (isLocalLikeHost(rootDomain)) {
    return rootDomain;
  }

  return (
    normalizeConfiguredDomain(
      process.env.NEXT_PUBLIC_MAIN_DOMAIN || process.env.MAIN_DOMAIN,
    ) || DEFAULT_MAIN_DOMAIN
  );
};

export const getConfiguredBaseDomains = () => {
  const configured =
    process.env.NEXT_PUBLIC_BASE_DOMAINS ||
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    DEFAULT_BASE_DOMAINS;

  return Array.from(
    new Set(
      parseConfiguredDomains(configured).concat(
        getConfiguredRootDomain(),
        getConfiguredMainDomain(),
      ),
    ),
  );
};

export const getConfiguredDashboardSubdomain = () =>
  normalizeConfiguredDomain(
    process.env.NEXT_PUBLIC_DASHBOARD_SUBDOMAIN ||
      process.env.DASHBOARD_SUBDOMAIN,
  ) || DEFAULT_DASHBOARD_SUBDOMAIN;
