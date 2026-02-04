export const getApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_URL;

  // In the browser we can safely align API calls to the current hostname to ensure
  // cookies work on dashboard.<host> in local dev (cookies are domain-based, not port-based).
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    if (envBase) {
      // If env is pointing at localhost but we're on e.g. dashboard.localhost,
      // prefer the current hostname so auth cookies are sent correctly.
      try {
        const envUrl = new URL(envBase);
        const envHostIsLocal =
          envUrl.hostname === "localhost" || envUrl.hostname === "127.0.0.1";

        if (envHostIsLocal && hostname !== envUrl.hostname) {
          const port = envUrl.port || "5000";
          return `${protocol}//${hostname}:${port}`;
        }
      } catch {
        // If envBase isn't a valid URL, fall back to using it as-is.
      }

      return envBase;
    }

    const port = 5000;
    return `${protocol}//${hostname}:${port}`;
  }

  return envBase || "http://localhost:5000";
};
