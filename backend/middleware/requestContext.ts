import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { runWithRequestContext } from "../utils/logger.js";
import logger from "../utils/logger.js";
import sliService from "../services/sliService.js";
import { getClientIp, sanitizeRequestId } from "../utils/request.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the request ID from the incoming `X-Request-Id` header,
 * falling back to a newly generated UUID v4.
 *
 * The incoming value is sanitized: only alphanumeric characters, hyphens,
 * underscores, dots, and colons are allowed, with a 128-char length limit.
 * This prevents log injection via crafted request IDs.
 */
const resolveRequestId = (req: Request): string =>
  sanitizeRequestId(req.headers["x-request-id"]) ?? crypto.randomUUID();

/**
 * Extract the W3C trace ID from the `traceparent` header (if present).
 * Format: `{version}-{trace-id}-{parent-id}-{trace-flags}`
 *
 * This enables log correlation with distributed tracing systems
 * (OpenTelemetry, Datadog, etc.) without requiring a full OTel SDK.
 */
const extractTraceId = (req: Request): string | undefined => {
  const traceparent = req.headers.traceparent;
  if (typeof traceparent !== "string") return undefined;

  // traceparent format: "00-<32 hex chars>-<16 hex chars>-<2 hex chars>"
  const parts = traceparent.split("-");
  if (parts.length >= 2 && /^[0-9a-f]{32}$/.test(parts[1])) {
    return parts[1];
  }

  return undefined;
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = resolveRequestId(req);
  const traceId = extractTraceId(req);

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  runWithRequestContext(
    {
      requestId,
      traceId,
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
