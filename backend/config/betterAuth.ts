// config/betterAuth.js
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database.js";
import { emailService } from "../services/emailService.js";
import { emailValidationService } from "../services/emailValidationService.js";
import { redisSessionStorage } from "./redis.js";
import logger from "../utils/logger.js";
import { redactEmail } from "../utils/redactPII.js";
import { parseConfiguredDomains } from "../utils/domainConfig.js";

// Inline helper to get base domains from environment
const getBaseDomains = () => {
  const envValue =
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    "localhost,inksigma.local,inksigma.xyz";
  return parseConfiguredDomains(envValue);
};

const getPreferredBaseDomain = () => {
  const baseDomains = getBaseDomains();
  return (
    baseDomains.find((d) => d.includes(".") && d !== "localhost") ||
    baseDomains[0] ||
    "localhost"
  );
};

const buildTrustedOrigins = () => {
  const fromEnv =
    process.env.TRUSTED_ORIGINS ||
    process.env.CORS_ORIGIN ||
    process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production" ? "https://inksigma.xyz" : "http://localhost:3000");

  const origins = new Set(
    fromEnv
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  const baseDomains = getBaseDomains();
  for (const baseDomain of baseDomains) {
    origins.add(`http://${baseDomain}:3000`);
    origins.add(`http://dashboard.${baseDomain}:3000`);
    origins.add(`http://*.${baseDomain}:3000`);
    origins.add(`https://${baseDomain}`);
    origins.add(`https://dashboard.${baseDomain}`);
    origins.add(`https://*.${baseDomain}`);
  }

  if (process.env.NODE_ENV === "development") {
    origins.add("http://*.local:3000");
    origins.add("http://*.localhost:3000");
    origins.add("https://*.local");
    origins.add("https://*.localhost");
  }

  return Array.from(origins);
};

const buildBaseUrl = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;

  const preferredBaseDomain = getPreferredBaseDomain();
  const dashboardSub = process.env.DASHBOARD_SUBDOMAIN || "dashboard";

  // Prefer dashboard.<base>:5000 so cookies align with dashboard host in local dev
  return `http://${dashboardSub}.${preferredBaseDomain}:5000`;
};

const getCrossSubdomainCookieDomain = () => {
  const preferredBaseDomain = getPreferredBaseDomain();

  // Prefer a real local/prod domain (e.g. inksigma.local / inksigma.com)
  // and avoid localhost because cross-subdomain cookies there are unreliable.
  if (preferredBaseDomain && preferredBaseDomain !== "localhost") {
    return preferredBaseDomain;
  }

  return undefined;
};

const crossSubdomainCookieDomain = getCrossSubdomainCookieDomain();
const isProduction = process.env.NODE_ENV === "production";

const isEmailConfigured = () => emailService.isConfigured();

const isGoogleConfigured = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL: buildBaseUrl(),
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: buildTrustedOrigins(),
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
    },
    ...(crossSubdomainCookieDomain
      ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: `.${crossSubdomainCookieDomain}`,
        },
      }
      : {}),
  },

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Correct better-auth v1.x API for secondary storage (Redis)
  secondaryStorage: redisSessionStorage,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache session in cookie for 5 minutes
    },
  },

  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false, // Make name field optional
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isEmailConfigured(),

    sendResetPassword: async ({ user, url }) => {
      logger.info(`[BETTER-AUTH] sendResetPassword called for: ${redactEmail(user.email)}`);
      try {
        await emailService.sendPasswordReset({
          email: user.email,
          name: user.name || "User",
          resetUrl: url,
        });
        logger.info(
          `[BETTER-AUTH] Reset password email sent successfully to ${redactEmail(user.email)}`,
        );
      } catch (error) {
        logger.error(
          error.message,
          "[BETTER-AUTH] Failed to send reset password email:",
        );
        throw error;
      }
    },
  },

  // Email verification configuration - this is where sendVerificationEmail should be
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      logger.info(
        `[BETTER-AUTH] sendVerificationEmail called for: ${redactEmail(user.email)}`,
      );

      try {
        const result = await emailService.sendVerification({
          email: user.email,
          name: user.name,
          verifyUrl: url,
        });
        logger.info(
          `[BETTER-AUTH] Verification email sent successfully, result: ${result?.messageId}`,
        );
      } catch (error) {
        // Log but do NOT rethrow — a missing/broken email config must not
        // turn a successful signup into a 500. The user was created; they
        // can request a new verification email later.
        logger.error(
          { err: error?.message },
          "[BETTER-AUTH] Failed to send verification email — email delivery may not be configured",
        );
      }
    },
  },

  socialProviders: {
    ...(isGoogleConfigured()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
          },
        }
      : {}),
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user?.email) {
            return;
          }

          logger.info(
            `[EMAIL-VALIDATION] Validating email: ${redactEmail(user.email)}`,
          );

          const validation = await emailValidationService.validateEmail(
            user.email,
          );
          if (!validation.isValid) {
            const errorMessage = validation.errors.join(", ");
            logger.info(
              `[EMAIL-VALIDATION] Rejected: ${redactEmail(user.email)} - ${errorMessage}`,
            );
            throw new Error(errorMessage);
          }

          logger.info(
            `[EMAIL-VALIDATION] Approved: ${redactEmail(user.email)}`,
          );
        },
      },
    },
  },
});
