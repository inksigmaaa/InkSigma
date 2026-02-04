const normalizeHost = (rawHost) => {
  if (!rawHost) return "";
  const lower = String(rawHost).trim().toLowerCase();
  // Strip IPv6 brackets and port if present
  const host = lower.startsWith("[") ? lower.slice(1) : lower;
  const withoutPort = host.split(":")[0];
  return withoutPort.endsWith("]") ? withoutPort.slice(0, -1) : withoutPort;
};

const getBaseDomains = () => {
  const envValue =
    process.env.BASE_DOMAINS || process.env.BASE_DOMAIN || "localhost";
  return envValue
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
};

const parseHost = (rawHost) => {
  const hostname = normalizeHost(rawHost);
  const baseDomains = getBaseDomains();

  let matchedBase = null;
  for (const baseDomain of baseDomains) {
    if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
      matchedBase = baseDomain;
      break;
    }
  }

  if (!matchedBase) {
    return {
      hostname,
      baseDomain: null,
      subdomain: null,
      isRootDomain: false,
      isCustomDomain: Boolean(hostname),
    };
  }

  if (hostname === matchedBase) {
    return {
      hostname,
      baseDomain: matchedBase,
      subdomain: null,
      isRootDomain: true,
      isCustomDomain: false,
    };
  }

  const suffix = `.${matchedBase}`;
  const subdomain = hostname.slice(0, -suffix.length);

  return {
    hostname,
    baseDomain: matchedBase,
    subdomain,
    isRootDomain: false,
    isCustomDomain: false,
  };
};

export { parseHost, normalizeHost, getBaseDomains };
