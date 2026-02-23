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
        const isLocalDevHost =
          hostname.endsWith(".local") || hostname.endsWith(".localhost");
        const usesApiSubdomain = envUrl.hostname.startsWith("api.");

        if (isLocalDevHost && usesApiSubdomain) {
          const backendPort = envUrl.port || "5000";
          return `${protocol}//${hostname}:${backendPort}`;
        }
      } catch {
        // Ignore malformed env URL and continue using fallback behavior.
      }
    }

    return normalizedEnvBase;
  }

  // Fallback for development without env config
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // Use api subdomain if on a subdomain, otherwise use same host
    if (hostname.includes('.')) {
      const parts = hostname.split('.');
      parts[0] = 'api';
      return `${protocol}//${parts.join('.')}:5000`;
    }
    return `${protocol}//${hostname}:5000`;
  }

  return "http://localhost:5000";
};
