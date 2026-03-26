import { and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { publication, publicationMember } from "../models/schema.js";

type PublicationRole = "owner" | "admin" | "editor" | "author" | null;

type PublicationAccess = {
  publication: any;
  isOwner: boolean;
  role: PublicationRole;
};

export const isAdminSessionUser = (user: any) => {
  return user?.role === "admin" || user?.isAdmin === true;
};

export const canAccessUserScopedResource = (sessionUser: any, targetUserId: string) => {
  if (!sessionUser?.id || !targetUserId) return false;
  if (sessionUser.id === targetUserId) return true;
  return isAdminSessionUser(sessionUser);
};

export const getPublicationAccess = async (
  userId: string,
  publicationId: number,
): Promise<PublicationAccess | null> => {
  if (!userId || !publicationId) return null;

  const [[pub], [membership]] = await Promise.all([
    db.select().from(publication).where(eq(publication.id, publicationId)).limit(1),
    db
      .select({ role: publicationMember.role })
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, publicationId),
          eq(publicationMember.userId, userId),
        ),
      )
      .limit(1),
  ]);

  if (!pub) return null;

  const isOwner = pub.userId === userId;
  const role: PublicationRole = isOwner ? "owner" : membership?.role || null;

  return {
    publication: pub,
    isOwner,
    role,
  };
};

export const hasPublicationRole = (
  access: PublicationAccess | null,
  allowedRoles: string[],
  options: { allowOwner?: boolean } = {},
) => {
  if (!access?.publication || !access.role) return false;

  const allowOwner = options.allowOwner ?? true;
  if (access.isOwner && allowOwner) return true;

  return allowedRoles.includes(access.role);
};
