import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IS_PRODUCTION = (() => {
  const env = (process.env.NODE_ENV || "development").toLowerCase();
  return env !== "development" && env !== "test";
})();

/** Safely extract the request ID for error correlation. */
const getRequestId = (req: Request): string | undefined => req.requestId;

/**
 * Map well-known HTTP status codes to a short error code string.
 * Used for responses where the error doesn't carry its own code.
 */
const STATUS_CODE_MAP: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
};

/**
 * @deprecated Migrate callers to throw AppError instead of "message|statusCode" strings.
 * This legacy format will be removed in a future release.
 */
const parsePipeError = (err: Error): { message: string; statusCode: number } => {
  const message = err.message;
  const pipeIndex = message.lastIndexOf("|");

  if (pipeIndex > 0) {
    const statusPart = message.slice(pipeIndex + 1);
    const statusCode = parseInt(statusPart, 10);
    if (!isNaN(statusCode) && statusCode >= 100 && statusCode < 600) {
      logger.warn(
        { errorMessage: message },
        "[DEPRECATED] Pipe-delimited error — migrate to AppError",
      );
      return { message: message.slice(0, pipeIndex), statusCode };
    }
  }

  return { message: err.message, statusCode: 500 };
};

// ---------------------------------------------------------------------------
// Error middleware
// ---------------------------------------------------------------------------

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Guard: if headers have already been sent (e.g., during streaming),
  // we cannot send another response — just log and let Express close.
  if (res.headersSent) {
    logger.error(
      { requestId: getRequestId(req), err },
      "Error after headers sent — connection will be closed",
    );
    return;
  }

  const requestId = getRequestId(req);

  logger.error(err, "Unhandled error");

  // --- Zod / Validation errors ---
  if (err.name === "ValidationError" || err.name === "ZodError") {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.errors || err.issues || err.message,
      requestId,
    });
    return;
  }

  // --- UnauthorizedError (e.g., from express-jwt or similar) ---
  if (err.name === "UnauthorizedError") {
    res.status(401).json({
      error: err.message || "Unauthorized",
      code: err.code || "UNAUTHORIZED",
      requestId,
    });
    return;
  }

  // --- AppError (our custom error hierarchy) ---
  if (err instanceof AppError) {
    const safeMessage =
      err.isOperational || !IS_PRODUCTION ? err.message : "Internal server error";

    res.status(err.statusCode).json({
      error: safeMessage,
      code: err.code || STATUS_CODE_MAP[err.statusCode] || "INTERNAL_ERROR",
      requestId,
    });
    return;
  }

  // --- Errors with a statusCode property (e.g., http-errors) ---
  if (typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600) {
    res.status(err.statusCode).json({
      error: IS_PRODUCTION ? "Internal server error" : err.message,
      code: err.code || STATUS_CODE_MAP[err.statusCode] || "INTERNAL_ERROR",
      requestId,
    });
    return;
  }

  // --- PostgreSQL unique constraint violation ---
  if (err.code === "23505") {
    res.status(409).json({
      error: "Resource already exists",
      code: "CONFLICT",
      requestId,
    });
    return;
  }

  // --- Legacy pipe-delimited errors (deprecated) ---
  const { message, statusCode } = parsePipeError(err);
  const safeMessage = IS_PRODUCTION && statusCode >= 500 ? "Internal server error" : message;

  res.status(statusCode).json({
    error: safeMessage,
    code: STATUS_CODE_MAP[statusCode] || "INTERNAL_ERROR",
    requestId,
  });
};

// ---------------------------------------------------------------------------
// 404 middleware
// ---------------------------------------------------------------------------

export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
    requestId: getRequestId(req),
  });
};
