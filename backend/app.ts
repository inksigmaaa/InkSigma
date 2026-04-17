import express from "express";
import crypto from "crypto";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import { db } from "./config/database.js";
import { getRedisClient, isRedisAvailable } from "./config/redis.js";
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
import sliService from "./services/sliService.js";
import logger from "./utils/logger.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/errorHandler.js";
import { getLifecycleState } from "./appState.js";

const getTimestamp = () => new Date().toISOString();

const checkDatabaseReadiness = async () => {
  try {
    await db.execute("SELECT 1");
    return { status: "ready" as const };
  } catch (error) {
    logger.error(error, "Database readiness check failed");
    return { status: "not_ready" as const };
  }
};

const checkRedisReadiness = async () => {
  try {
    const client = getRedisClient();

    if (!client || !isRedisAvailable()) {
      return { status: "degraded" as const };
    }

    await client.ping();
    return { status: "ready" as const };
  } catch (error) {
    logger.warn(error, "Redis readiness check degraded");
    return { status: "degraded" as const };
  }
};

const registerHealthRoutes = (app: express.Express) => {
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: getTimestamp(),
    });
  });

  app.get("/ready", async (req, res) => {
    const [{ isShuttingDown, isStartupComplete }, database, redis] = await Promise.all([
      Promise.resolve(getLifecycleState()),
      checkDatabaseReadiness(),
      checkRedisReadiness(),
    ]);

    const startup = isStartupComplete ? "ready" : "starting";
    const ready =
      database.status === "ready" && startup === "ready" && !isShuttingDown;

    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      timestamp: getTimestamp(),
      checks: {
        database: database.status,
        redis: redis.status,
        startup,
        shuttingDown: isShuttingDown ? "shutting_down" : "ready",
      },
    });
  });
};

export const createApp = () => {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";

  // Production assumes exactly one trusted reverse proxy in front of Express.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          imgSrc: ["'self'"],
          styleSrc: ["'none'"],
          scriptSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      strictTransportSecurity: isProduction ? undefined : false,
    }),
  );
  // Global request timeout — abort requests that exceed this threshold
  // to prevent indefinite connection hold from slow queries or external calls.
  const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30_000);
  app.use((req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          error: "Request timed out",
          code: "REQUEST_TIMEOUT",
        });
      }
    }, REQUEST_TIMEOUT_MS);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));
    next();
  });

  app.use(requestContextMiddleware);
  app.use(corsMiddleware);
  registerHealthRoutes(app);
  app.use(subdomainMiddleware);
  app.use(rateLimitMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Blog routes may carry large article bodies — allow up to 5MB for those.
  app.use("/api/blogs", express.json({ limit: "5mb" }));

  logger.info({ step: "auth.mount", status: "start" }, "Mounting auth handler");
  try {
    const authHandler = toNodeHandler(auth);
    app.use("/api/auth", authHandler);
    logger.info({ step: "auth.mount", status: "done" }, "Mounted auth handler");
  } catch (error) {
    logger.error(error, "Failed to mount auth handler");
  }

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

  app.get("/health/slis", (req, res) => {
    const expectedToken = process.env.HEALTH_SLI_TOKEN;

    if (isProduction) {
      if (!expectedToken) {
        return res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
      }

      const supplied = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const suppliedBuf = Buffer.from(supplied);
      const expectedBuf = Buffer.from(expectedToken);
      if (
        !supplied ||
        suppliedBuf.length !== expectedBuf.length ||
        !crypto.timingSafeEqual(suppliedBuf, expectedBuf)
      ) {
        return res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      }
    }

    const { isShuttingDown } = getLifecycleState();

    res.json({
      status: "ok",
      timestamp: getTimestamp(),
      shuttingDown: isShuttingDown,
      slis: sliService.getSnapshot(),
    });
  });

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export default createApp;
