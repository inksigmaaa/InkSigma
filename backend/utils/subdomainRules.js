const RESERVED_SUBDOMAINS = new Set([
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

const normalizeSubdomain = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const isReservedSubdomain = (value) => {
  const normalized = normalizeSubdomain(value);
  if (!normalized) return false;
  return RESERVED_SUBDOMAINS.has(normalized);
};

export { RESERVED_SUBDOMAINS, normalizeSubdomain, isReservedSubdomain };
