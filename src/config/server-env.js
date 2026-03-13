const isProduction = process.env.NODE_ENV === "production";

function normalizeBaseUrl(value) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

export function getRequiredServerEnv(name) {
  const value = process.env[name];
  if (value) {
    return value;
  }

  throw new Error(`Missing required server environment variable: ${name}`);
}

export function getOptionalServerEnv(name) {
  return process.env[name] ?? null;
}

export function getAuthBaseUrl() {
  const configuredUrl = normalizeBaseUrl(
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL
  );
  const vercelUrl = normalizeBaseUrl(
    process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL
  );

  if (configuredUrl) {
    return configuredUrl;
  }

  if (vercelUrl) {
    return vercelUrl;
  }

  if (!isProduction) {
    return "http://localhost:3000";
  }

  throw new Error(
    "Missing required server environment variable: BETTER_AUTH_URL or VERCEL_URL"
  );
}
