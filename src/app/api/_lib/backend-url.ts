const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";

const normalizeDomain = (domain: string | undefined) =>
  domain
    ?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .toLowerCase();

const getConfiguredBaseDomains = () => {
  const configured =
    process.env.NEXT_PUBLIC_BASE_DOMAINS ||
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    "";

  return configured.split(",").map(normalizeDomain).filter(Boolean) as string[];
};

const getFrontendHosts = () => {
  const hosts = new Set<string>();

  const addHost = (value: string | undefined) => {
    if (!value) return;

    try {
      hosts.add(new URL(value).hostname.toLowerCase());
      return;
    } catch {
      const normalized = normalizeDomain(value);
      if (normalized) {
        hosts.add(normalized);
      }
    }
  };

  addHost(process.env.NEXT_PUBLIC_APP_URL);
  addHost(process.env.FRONTEND_URL);
  addHost(process.env.VERCEL_URL);
  addHost(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  for (const domain of getConfiguredBaseDomains()) {
    hosts.add(domain);
    hosts.add(`www.${domain}`);
    hosts.add(`dashboard.${domain}`);
  }

  return hosts;
};

export const resolveBackendBaseUrl = () => {
  const explicitBackendUrl = process.env.BACKEND_URL?.trim();
  const nonVercelFallback = !isVercel
    ? process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim()
    : "";
  const rawBackendUrl =
    explicitBackendUrl ||
    nonVercelFallback ||
    (!isProduction ? "http://localhost:5000" : "");

  if (!rawBackendUrl) {
    throw new Error(
      "BACKEND_URL is required for production API proxying. Point it at the real backend origin, such as the Render service URL.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawBackendUrl);
  } catch {
    throw new Error(`Invalid BACKEND_URL: "${rawBackendUrl}"`);
  }

  const backendHost = parsedUrl.hostname.toLowerCase();
  if (isVercel && getFrontendHosts().has(backendHost)) {
    throw new Error(
      `BACKEND_URL points at the frontend host "${backendHost}", so /api requests would loop back into Next.js instead of reaching the backend service.`,
    );
  }

  return rawBackendUrl.replace(/\/$/, "");
};
