const isLocalLikeHostname = (hostname) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname.endsWith(".local") ||
  hostname.endsWith(".localhost");

const inferBaseDomainFromHostname = (hostname) => {
  const normalizedHostname = String(hostname || "").trim().toLowerCase();
  if (!normalizedHostname) {
    return null;
  }

  if (normalizedHostname === "localhost" || normalizedHostname === "dashboard.localhost") {
    return "localhost";
  }

  const labels = normalizedHostname.split(".").filter(Boolean);
  if (labels.length < 2) {
    return normalizedHostname;
  }

  return labels.slice(-2).join(".");
};

export const getApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

  if (envBase) {
    const normalizedEnvBase = envBase.replace(/\/$/, "");

    // Safari can treat *.local subdomains as cross-site and drop auth cookies.
    // In local development, prefer same-host backend origin to keep auth first-party.
    if (typeof window !== "undefined") {
      try {
        const envUrl = new URL(normalizedEnvBase);
        const { protocol, hostname } = window.location;
        const isLocalDevHost = isLocalLikeHostname(hostname);
        const usesApiSubdomain = envUrl.hostname.startsWith("api.");

        if (isLocalDevHost && usesApiSubdomain) {
          const backendPort = envUrl.port || "5000";
          const backendHost =
            hostname === "::1"
              ? "[::1]"
              : hostname;
          return `${protocol}//${backendHost}:${backendPort}`;
        }
      } catch {
        // Ignore malformed env URL and continue using fallback behavior.
      }
    }

    return normalizedEnvBase;
  }

  // Fallback for development without env config
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;

    if (isLocalLikeHostname(hostname)) {
      const backendPort = port || "5000";
      return `${protocol}//localhost:${backendPort}`;
    }

    const configuredRootDomain = (
      process.env.NEXT_PUBLIC_ROOT_DOMAIN || ""
    ).trim().toLowerCase();
    const baseDomain =
      configuredRootDomain && !isLocalLikeHostname(configuredRootDomain)
        ? configuredRootDomain
        : inferBaseDomainFromHostname(hostname);

    if (baseDomain && !isLocalLikeHostname(baseDomain)) {
      return `${protocol}//api.${baseDomain}`;
    }

    return `${protocol}//${hostname}:5000`;
  }

  return "http://localhost:5000";
};
