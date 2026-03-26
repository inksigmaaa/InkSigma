import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import { setRequestContext } from "../utils/logger.js";
import logger from "../utils/logger.js";
import sliService from "../services/sliService.js";

const getSessionUser = async (req) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return session?.user || null;
};

export const requireAuth = async (req, res, next) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      sliService.recordAuthFailure();
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = sessionUser;
    setRequestContext({ userId: sessionUser.id });
    return next();
  } catch (error) {
    logger.error(error, "Auth error:");
    sliService.recordAuthFailure();
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const attachOptionalAuth = async (req, _res, next) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (sessionUser) {
      req.user = sessionUser;
      setRequestContext({ userId: sessionUser.id });
    }
  } catch {
    // Optional auth should never block request flow.
  }

  return next();
};
