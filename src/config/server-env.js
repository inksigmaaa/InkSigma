const isProduction = process.env.NODE_ENV === "production";

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
  const configuredUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (!isProduction) {
    return "http://localhost:3000";
  }

  throw new Error(
    "Missing required server environment variable: BETTER_AUTH_URL"
  );
}
