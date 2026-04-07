import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

const shouldSanitizeErrors = () => {
  const env = (process.env.NODE_ENV || "development").toLowerCase();
  return env !== "development" && env !== "test";
};

/** @deprecated Migrate callers to throw AppError instead of "message|statusCode" strings. */
const parsePipeError = (err: Error): { message: string; statusCode: number } => {
  const message = err.message;
  const pipeIndex = message.lastIndexOf("|");

  if (pipeIndex > 0) {
    const statusPart = message.slice(pipeIndex + 1);
    const statusCode = parseInt(statusPart, 10);
    if (!isNaN(statusCode) && statusCode >= 100 && statusCode < 600) {
      logger.warn(
        { errorMessage: message },
        "[DEPRECATED] Pipe-delimited error detected — migrate to AppError",
      );
      return {
        message: message.slice(0, pipeIndex),
        statusCode,
      };
    }
  }

  return { message: err.message, statusCode: 500 };
};

export const errorMiddleware = (err, req, res, next) => {
  logger.error(err, "Error:");

  if (err.name === "ValidationError" || err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.errors || err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: err.message || "Unauthorized",
      code: err.code || "UNAUTHORIZED",
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error:
        err.isOperational || !shouldSanitizeErrors()
          ? err.message
          : "Internal server error",
      code: err.code,
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: shouldSanitizeErrors() ? "Internal server error" : err.message,
      code: err.code,
    });
  }

  const { message, statusCode } = parsePipeError(err);

  if (statusCode === 404) {
    return res.status(404).json({
      error: message,
      code: "NOT_FOUND",
    });
  }

  if (statusCode === 403) {
    return res.status(403).json({
      error: message,
      code: "FORBIDDEN",
    });
  }

  if (statusCode === 401) {
    return res.status(401).json({
      error: message,
      code: "UNAUTHORIZED",
    });
  }

  if (statusCode === 400) {
    return res.status(400).json({
      error: message,
      code: "BAD_REQUEST",
    });
  }

  if (statusCode === 409) {
    return res.status(409).json({
      error: message,
      code: "CONFLICT",
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      error: "Resource already exists",
      code: "CONFLICT",
    });
  }

  res.status(statusCode).json({
    error: shouldSanitizeErrors() ? "Internal server error" : message,
    code: "INTERNAL_ERROR",
  });
};

export const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
  });
};
