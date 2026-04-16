import crypto from "crypto";
import { runWithRequestContext } from "../utils/logger.js";
import logger from "../utils/logger.js";
import sliService from "../services/sliService.js";

const getRequestId = (req) => {
  const incomingRequestId = req.headers["x-request-id"];
  if (typeof incomingRequestId === "string" && incomingRequestId.trim()) {
    return incomingRequestId.trim();
  }

  return crypto.randomUUID();
};

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || "unknown";

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
        const durationMs = Date.now() - start;
        sliService.recordRequest(durationMs, res.statusCode);
        logger.info(
          {
            statusCode: res.statusCode,
            durationMs,
          },
          "Request completed",
        );
      });

      next();
    },
  );
};
