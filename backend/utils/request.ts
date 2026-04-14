import type { Request } from "express";

/** Maximum allowed length for an externally-supplied request ID. */
export const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Extract the client IP from the request.
 * Relies on Express `trust proxy` being configured so that `req.ip`
 * reflects the real client IP behind reverse proxies.
 */
export const getClientIp = (req: Request): string =>
  String(req.ip || req.socket?.remoteAddress || "unknown");

/**
 * Validate and sanitize an externally-supplied request ID.
 * Returns the trimmed value if it passes length and character checks,
 * or null if it should be replaced with a generated ID.
 */
export const sanitizeRequestId = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REQUEST_ID_LENGTH) return null;

  // Allow alphanumeric, hyphens, underscores, dots, and colons (common in trace IDs).
  if (!/^[\w.\-:]+$/.test(trimmed)) return null;

  return trimmed;
};
