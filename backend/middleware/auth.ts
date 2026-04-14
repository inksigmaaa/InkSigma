import type { Request, Response, NextFunction } from "express";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import { setRequestContext } from "../utils/logger.js";
import logger from "../utils/logger.js";
import sliService from "../services/sliService.js";
import type { SessionUser } from "../types/express.js";

// ---------------------------------------------------------------------------
// Singleflight deduplication
// ---------------------------------------------------------------------------
// When multiple concurrent requests arrive with the same session token,
// collapse them into a single getSession() call instead of N independent ones.
// Entries are deleted as soon as the promise settles.
// ---------------------------------------------------------------------------

const inflight = new Map<string, Promise<SessionUser | null>>();

const extractSessionToken = (req: Request): string | null => {
  const cookie = req.headers.cookie;
  if (!cookie) return null;

  // Better-Auth stores the session in a cookie named "better-auth.session_token"
  // (or "__Secure-better-auth.session_token" in production with secure cookies).
  for (const pair of cookie.split(";")) {
    const trimmed = pair.trim();
    if (
      trimmed.startsWith("better-auth.session_token=") ||
      trimmed.startsWith("__Secure-better-auth.session_token=")
    ) {
      return trimmed.split("=").slice(1).join("=") || null;
    }
  }

  return null;
};

const getSessionUser = async (req: Request): Promise<SessionUser | null> => {
  const token = extractSessionToken(req);

  // No token — definitely unauthenticated, skip the API call.
  if (!token) return null;

  // Deduplicate concurrent lookups for the same token.
  const existing = inflight.get(token);
  if (existing) return existing;

  const promise = auth.api
    .getSession({ headers: fromNodeHeaders(req.headers) })
    .then((session) => (session?.user as SessionUser) ?? null)
    .finally(() => {
      inflight.delete(token);
    });

  inflight.set(token, promise);
  return promise;
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionUser = await getSessionUser(req);

    if (!sessionUser) {
      sliService.recordAuthFailure();
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    req.user = sessionUser;
    setRequestContext({ userId: sessionUser.id });
    next();
  } catch (error) {
    // Distinguish infrastructure failures (DB/Redis down) from auth failures.
    // Returning 401 for transient infra issues would force legitimate users
    // to re-login; 503 signals the client should retry.
    logger.error(error, "Session validation infrastructure error");
    sliService.recordAuthFailure();
    res.status(503).json({
      error: "Service temporarily unavailable",
      code: "AUTH_UNAVAILABLE",
    });
  }
};
