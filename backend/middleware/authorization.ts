import type { Request, Response, NextFunction } from "express";
import {
  canAccessUserScopedResource,
  getPublicationAccess,
  hasPublicationRole,
} from "../services/authorizationService.js";
import { and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { notification } from "../models/schema.js";
import { setRequestContext } from "../utils/logger.js";
import type { PublicationRole } from "../types/express.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a route parameter as a positive integer.
 * Returns the parsed number or null if invalid.
 */
const parsePositiveInt = (raw: unknown): number | null => {
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// ---------------------------------------------------------------------------
// Middleware factories
// ---------------------------------------------------------------------------

/**
 * Require that the authenticated user can access a user-scoped resource.
 * Grants access if the user is the resource owner or a platform admin.
 */
export const requireUserParamAccess = (userIdParam = "userId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawTargetUserId = req.params?.[userIdParam];
    const targetUserId = Array.isArray(rawTargetUserId) ? rawTargetUserId[0] : rawTargetUserId;

    if (!targetUserId) {
      res.status(400).json({ error: "User ID is required", code: "BAD_REQUEST" });
      return;
    }

    if (!canAccessUserScopedResource(req.user, targetUserId)) {
      res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      return;
    }

    setRequestContext({ userId: targetUserId });
    next();
  };
};

/**
 * Require that the authenticated user holds one of the allowed roles
 * within the target publication.
 *
 * Fetches the publication and membership in parallel, attaches
 * `req.publication`, `req.publicationAccess`, and `req.userRole`.
 */
export const requirePublicationRole = (
  allowedRoles: PublicationRole[],
  options: { publicationIdParam?: string; allowOwner?: boolean } = {},
) => {
  const publicationIdParam = options.publicationIdParam || "publicationId";

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const publicationId = parsePositiveInt(req.params?.[publicationIdParam]);

    if (publicationId === null) {
      res.status(400).json({ error: "Invalid publication ID", code: "BAD_REQUEST" });
      return;
    }

    const access = await getPublicationAccess(req.user?.id!, publicationId);

    if (!access?.publication) {
      res.status(404).json({ error: "Publication not found", code: "NOT_FOUND" });
      return;
    }

    if (!hasPublicationRole(access, allowedRoles, options)) {
      res.status(403).json({ error: "Access denied", code: "FORBIDDEN" });
      return;
    }

    req.publication = access.publication;
    req.publicationAccess = access;
    req.userRole = access.isOwner ? "admin" : (access.role as PublicationRole);
    setRequestContext({ publicationId: access.publication.id });
    next();
  };
};

/**
 * Require that the authenticated user owns the target notification.
 */
export const requireNotificationOwnership = (notificationIdParam = "notificationId") => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const notificationId = parsePositiveInt(req.params?.[notificationIdParam]);

    if (notificationId === null) {
      res.status(400).json({ error: "Invalid notification ID", code: "BAD_REQUEST" });
      return;
    }

    const [ownedNotification] = await db
      .select({ id: notification.id, userId: notification.userId })
      .from(notification)
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, req.user?.id!),
        ),
      )
      .limit(1);

    if (!ownedNotification) {
      res.status(404).json({ error: "Notification not found", code: "NOT_FOUND" });
      return;
    }

    setRequestContext({ userId: ownedNotification.userId });
    req.notificationId = notificationId;
    next();
  };
};
