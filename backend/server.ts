import "dotenv/config";
import type { Server } from "http";
import { emailService } from "./services/emailService.js";
import schedulerService from "./services/schedulerService.js";
import invitationService from "./services/invitationService.js";
import logger from "./utils/logger.js";
import {
  isShuttingDown,
  isStartupComplete,
  setShuttingDown,
  setStartupComplete,
} from "./appState.js";

const PORT = Number(process.env.PORT || 5000);
const SHUTDOWN_TIMEOUT_MS = 10_000;
const REQUIRED_ENV_VARS = ["DATABASE_URL", "NODE_ENV"] as const;
const ALLOWED_NODE_ENVS = new Set(["development", "test", "production"]);

const logStartupStep = (
  step: string,
  status: "start" | "done" | "warn" | "fail",
  details: Record<string, unknown> = {},
) => {
  logger.info({ step, status, ...details }, "Startup step");
};

const validateRequiredEnvVars = () => {
  logStartupStep("env.validate", "start");

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    const error = new Error(`Missing required environment variables: ${missing.join(", ")}`);
    logger.error({ step: "env.validate", missing }, error.message);
    throw error;
  }

  if (!ALLOWED_NODE_ENVS.has(process.env.NODE_ENV || "")) {
    const error = new Error(
      `Invalid NODE_ENV: ${process.env.NODE_ENV}. Expected one of ${Array.from(ALLOWED_NODE_ENVS).join(", ")}`,
    );
    logger.error({ step: "env.validate", nodeEnv: process.env.NODE_ENV }, error.message);
    throw error;
  }

  const sessionSecret = process.env.SESSION_SECRET?.trim();
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET?.trim();

  if (!sessionSecret && !betterAuthSecret) {
    const error = new Error(
      "Missing required environment variable: SESSION_SECRET or BETTER_AUTH_SECRET",
    );
    logger.error({ step: "env.validate" }, error.message);
    throw error;
  }

  if (!sessionSecret && betterAuthSecret) {
    logger.warn(
      { step: "env.validate", envVar: "BETTER_AUTH_SECRET" },
      "SESSION_SECRET is missing; using BETTER_AUTH_SECRET for auth secret compatibility",
    );
  }

  process.env.BETTER_AUTH_SECRET ||= sessionSecret;

  logStartupStep("env.validate", "done", { nodeEnv: process.env.NODE_ENV });
};

const closeServer = (server: Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const registerGracefulShutdown = (server: Server) => {
  let shutdownPromise: Promise<void> | null = null;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shutdownPromise) {
      logger.warn({ signal }, "Shutdown already in progress");
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      setShuttingDown(true);
      logStartupStep("shutdown", "start", {
        signal,
        isStartupComplete,
        isShuttingDown,
      });

      const forcedExitTimer = setTimeout(() => {
        logger.error(
          { step: "shutdown", status: "fail", timeoutMs: SHUTDOWN_TIMEOUT_MS },
          "Forced shutdown timeout reached",
        );
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);

      try {
        await closeServer(server);
        schedulerService.stop();
        invitationService.stopScheduler();
        const { pool } = await import("./config/database.js");
        await pool.end();
        logStartupStep("shutdown", "done", { signal });
        process.exit(0);
      } catch (error) {
        logger.error(error, "Graceful shutdown failed");
        process.exit(1);
      } finally {
        clearTimeout(forcedExitTimer);
      }
    })();

    return shutdownPromise;
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

const verifyDatabase = async () => {
  logStartupStep("database.verify", "start");
  const { db } = await import("./config/database.js");
  await db.execute("SELECT 1");
  logStartupStep("database.verify", "done");
};

const verifySmtp = async () => {
  logStartupStep("smtp.verify", "start");
  const smtpReady = await emailService.verify();

  if (!smtpReady) {
    logger.warn(
      { step: "smtp.verify", status: "warn" },
      "SMTP is not configured properly; email delivery is degraded",
    );
    return;
  }

  logStartupStep("smtp.verify", "done");
};

const startBackgroundServices = () => {
  logStartupStep("background.start", "start");
  schedulerService.start();
  invitationService.startScheduler();
  logStartupStep("background.start", "done");
};

export const bootstrap = async () => {
  validateRequiredEnvVars();
  setShuttingDown(false);
  setStartupComplete(false);

  logStartupStep("app.load", "start");
  const { createApp } = await import("./app.js");
  const app = createApp();
  app.locals.schedulerService = schedulerService;
  logStartupStep("app.load", "done");

  logStartupStep("http.listen", "start", { port: PORT });
  const server = app.listen(PORT, () => {
    logStartupStep("http.listen", "done", { port: PORT });
  });

  registerGracefulShutdown(server);

  try {
    await verifyDatabase();
    await verifySmtp();
    startBackgroundServices();
    setStartupComplete(true);
    logStartupStep("startup.complete", "done", { port: PORT });
  } catch (error) {
    logger.error(error, "Startup validation failed");
    await closeServer(server).catch((closeError) => {
      logger.error(closeError, "Failed to close server after startup error");
    });
    const { pool } = await import("./config/database.js");
    await pool.end().catch((poolError) => {
      logger.error(poolError, "Failed to close database pool after startup error");
    });
    throw error;
  }

  return { app, server };
};

void bootstrap().catch((error) => {
  logger.error(error, "Failed to bootstrap server");
  process.exit(1);
});
