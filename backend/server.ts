import "dotenv/config";
import express from "express";
import helmet from "helmet";
import type { Server } from "http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import { db, pool } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import publicationMemberRoutes from "./routes/publicationMemberRoutes.js";
import publicationStatsRoutes from "./routes/publicationStatsRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import resendVerificationRoutes from "./routes/resendVerificationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import viewRoutes from "./routes/viewRoutes.js";
import { corsMiddleware } from "./middleware/cors.js";
import { subdomainMiddleware } from "./middleware/subdomainMiddleware.js";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";
import { emailService } from "./services/emailService.js";
import schedulerService from "./services/schedulerService.js";
import invitationService from "./services/invitationService.js";
import sliService from "./services/sliService.js";
import logger from "./utils/logger.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/errorHandler.js";

const PORT = process.env.PORT || 5000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

export let isShuttingDown = false;

export const createApp = () => {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";

  // Production assumes exactly one trusted reverse proxy in front of Express.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
      strictTransportSecurity: isProduction ? undefined : false,
    }),
  );
  app.use(requestContextMiddleware);
  app.use(corsMiddleware);
  app.use(subdomainMiddleware);
  app.use(rateLimitMiddleware);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Static file serving
  app.use("/uploads", express.static("uploads"));

  // Authentication routes
  logger.info("Mounting better-auth handler at /api/auth");
  try {
    const authHandler = toNodeHandler(auth);
    app.use("/api/auth", authHandler);
    logger.info("Better-auth handler mounted successfully");
  } catch (error) {
    logger.error(error, "Error mounting better-auth handler:");
  }

  // API routes
  app.use("/api/custom", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/blogs", blogRoutes);
  app.use("/api/upload-image", uploadRoutes);
  app.use("/api/publications", publicationRoutes);
  app.use("/api/publication-members", publicationMemberRoutes);
  app.use("/api/publication-stats", publicationStatsRoutes);
  app.use("/api/members", memberRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/views", viewRoutes);
  app.use("/api", resendVerificationRoutes);

  // Debug routes have been removed for security

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      shuttingDown: isShuttingDown,
    });
  });

  app.get("/health/slis", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      shuttingDown: isShuttingDown,
      slis: sliService.getSnapshot(),
    });
  });

  // Global error handler - must be after all routes
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
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
      isShuttingDown = true;
      logger.info({ signal }, "Shutting down server");

      const forcedExitTimer = setTimeout(() => {
        logger.error(
          { timeoutMs: SHUTDOWN_TIMEOUT_MS },
          "Forced shutdown timeout reached",
        );
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);

      try {
        await closeServer(server);
        schedulerService.stop();
        invitationService.stopScheduler();
        await pool.end();
        logger.info("Graceful shutdown completed");
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

export const bootstrap = async () => {
  const app = createApp();
  const server = app.listen(PORT, async () => {
    logger.info(`Server running on http://localhost:${PORT}`);

    // Check database connection
    logger.info("Checking database connection...");
    try {
      await db.execute("SELECT 1");
      logger.info("Database connection verified");
      logger.info("Run 'npm run db:push' to sync schema changes");
    } catch (error) {
      logger.error(error, "Database connection failed");
    }

    // Verify SMTP connection
    const smtpReady = await emailService.verify();
    if (!smtpReady) {
      logger.error(
        "WARNING: SMTP not configured properly. Emails will not be sent!",
      );
      logger.error("Check SMTP_USER and SMTP_PASS in .env file");
    }

    // Initialize scheduler
    app.locals.schedulerService = schedulerService;
    schedulerService.start();

    // Initialize invitation cleanup
    invitationService.startScheduler();
  });

  registerGracefulShutdown(server);

  return { app, server };
};

void bootstrap().catch((error) => {
  logger.error(error, "Failed to bootstrap server");
  process.exit(1);
});
