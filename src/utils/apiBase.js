export const getApiBase = () => {
  // In the browser, check if we're in production (non-local) context.
  // Production uses Next.js rewrites to proxy /api/* to the backend,
  // so we return "" (same-origin) to avoid cross-origin CORS issues.
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isLocalDevHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".localhost");

    if (!isLocalDevHost) {
      // Production: use same-origin paths, proxied by Next.js rewrites
      return "";
    }

    // Local development: connect directly to the backend
    const envBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (envBase) {
      const normalizedEnvBase = envBase.replace(/\/$/, "");
      try {
        const envUrl = new URL(normalizedEnvBase);
        const usesApiSubdomain = envUrl.hostname.startsWith("api.");

        if (usesApiSubdomain) {
          const backendPort = envUrl.port || "5000";
          const backendHost = hostname === "::1" ? "[::1]" : hostname;
          return `${protocol}//${backendHost}:${backendPort}`;
        }
      } catch {
        // Ignore malformed env URL
      }
      return normalizedEnvBase;
    }

    // Fallback for development without env config
    const { port } = window.location;
    if (hostname.includes('.localhost') || hostname.includes('.local')) {
      const backendPort = port || "5000";
      return `${protocol}//localhost:${backendPort}`;
    }
    return `${protocol}//${hostname}:5000`;
  }

  // Server-side: use actual backend URL
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production" ? "https://api.inksigma.xyz" : "http://localhost:5000")
  );
};
