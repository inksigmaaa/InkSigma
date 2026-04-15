import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

const getBaseDomain = () =>
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  (process.env.NODE_ENV === "production" ? "inksigma.xyz" : "localhost");

const isGoogleConfigured = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const buildBaseUrl = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return process.env.NODE_ENV === "production"
    ? "https://dashboard.inksigma.xyz"
    : "http://localhost:3000";
};

const buildTrustedOrigins = () => {
  const baseDomain = getBaseDomain();
  const origins: string[] = [
    `https://${baseDomain}`,
    `https://dashboard.${baseDomain}`,
    `https://*.${baseDomain}`,
  ];

  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://dashboard.inksigma.local:3000",
      "http://inksigma.local:3000",
    );
  }

  return origins;
};

const baseDomain = getBaseDomain();

export const auth = betterAuth({
  baseURL: buildBaseUrl(),
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: buildTrustedOrigins(),

  advanced:
    baseDomain && baseDomain !== "localhost"
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: baseDomain,
          },
        }
      : undefined,

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    ...(isGoogleConfigured()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                prompt: "select_account",
              },
            },
          },
        }
      : {}),
  },
});
