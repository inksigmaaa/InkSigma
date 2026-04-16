import {
  canAccessUserScopedResource,
  getPublicationAccess,
  hasPublicationRole,
} from "../services/authorizationService.js";
import { and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { notification } from "../models/schema.js";
import { setRequestContext } from "../utils/logger.js";

export const requireUserParamAccess = (userIdParam = "userId") => {
  return (req, res, next) => {
    const targetUserId = req.params?.[userIdParam];

    if (!targetUserId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!canAccessUserScopedResource(req.user, targetUserId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    setRequestContext({ userId: targetUserId });

    return next();
  };
};

export const requirePublicationRole = (
  allowedRoles: string[],
  options: { publicationIdParam?: string; allowOwner?: boolean } = {},
) => {
  const publicationIdParam = options.publicationIdParam || "publicationId";

  return async (req, res, next) => {
    const rawPublicationId = req.params?.[publicationIdParam];
    const publicationId = Number.parseInt(String(rawPublicationId), 10);

    if (!Number.isFinite(publicationId)) {
      return res.status(400).json({ error: "Invalid publication ID" });
    }

    const access = await getPublicationAccess(req.user?.id, publicationId);
    if (!access?.publication) {
      return res.status(404).json({ error: "Publication not found" });
    }

    if (!hasPublicationRole(access, allowedRoles, options)) {
      return res.status(403).json({ error: "Access denied" });
    }

    req.publication = access.publication;
    req.publicationAccess = access;
    req.userRole = access.isOwner ? "admin" : access.role;
    setRequestContext({ publicationId: access.publication.id });
    return next();
  };
};

export const requireNotificationOwnership = (
  notificationIdParam = "notificationId",
) => {
  return async (req, res, next) => {
    const rawNotificationId = req.params?.[notificationIdParam];
    const notificationId = Number.parseInt(String(rawNotificationId), 10);

    if (!Number.isFinite(notificationId)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const [ownedNotification] = await db
      .select({ id: notification.id, userId: notification.userId })
      .from(notification)
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, req.user?.id),
        ),
      )
      .limit(1);

    if (!ownedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    setRequestContext({ userId: ownedNotification.userId });
    req.notificationId = notificationId;
    return next();
  };
};
