export const getApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

  // Always use the configured backend URL if available
  if (envBase) {
    return envBase.replace(/\/$/, ''); // Remove trailing slash
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
