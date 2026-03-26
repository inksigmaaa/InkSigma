import crypto from "crypto";
import { runWithRequestContext } from "../utils/logger.js";
import logger from "../utils/logger.js";

const getRequestId = (req) => {
  const incomingRequestId = req.headers["x-request-id"];
  if (typeof incomingRequestId === "string" && incomingRequestId.trim()) {
    return incomingRequestId.trim();
  }

  return crypto.randomUUID();
};

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
};

export const requestContextMiddleware = (req, res, next) => {
  const requestId = getRequestId(req);
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  runWithRequestContext(
    {
      requestId,
      method: req.method,
      route: req.originalUrl || req.url,
    },
    () => {
      const start = Date.now();
      logger.info(
        {
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"] || "unknown",
        },
        "Request started",
      );

      res.on("finish", () => {
        logger.info(
          {
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
          },
          "Request completed",
        );
      });

      next();
    },
  );
};
