import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import { setRequestContext } from "../utils/logger.js";
import logger from "../utils/logger.js";
import sliService from "../services/sliService.js";
import {
  readPublicSiteAuthTokenFromHeaders,
  verifyPublicSiteAuthToken,
} from "../services/publicSiteAuthService.js";

const getSessionUser = async (req) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return session?.user || null;
};

const getPublicSiteUser = (req) => {
  const token = readPublicSiteAuthTokenFromHeaders(req.headers);
  const payload = verifyPublicSiteAuthToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    image: payload.image,
    username: payload.username,
  };
};

export const resolveRequestUser = async (
  req,
  { allowPublicSiteToken = false } = {},
) => {
  const sessionUser = await getSessionUser(req);
  if (sessionUser) {
    return sessionUser;
  }

  if (!allowPublicSiteToken) {
    return null;
  }

  return getPublicSiteUser(req);
};

const requireResolvedUser =
  ({ allowPublicSiteToken = false } = {}) =>
  async (req, res, next) => {
    try {
      const sessionUser = await resolveRequestUser(req, {
        allowPublicSiteToken,
      });
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

export const requireAuth = requireResolvedUser();

export const requireSessionOrPublicSiteAuth = requireResolvedUser({
  allowPublicSiteToken: true,
});

export const requireReaderAuth = async (req, res, next) => {
  try {
    const sessionUser = await resolveRequestUser(req, {
      allowPublicSiteToken: true,
    });
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
