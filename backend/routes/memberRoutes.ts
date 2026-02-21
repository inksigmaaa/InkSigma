// routes/memberRoutes.js
import express from "express";
import { db } from "../config/database.js";
import {
  publicationMember,
  invitation,
  publication,
  user,
} from "../models/schema.js";
import { eq, and, or } from "drizzle-orm";
import crypto from "crypto";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
import nodemailer from "nodemailer";
import notificationService from "../services/notificationService.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Middleware to get current user from session
const getCurrentUser = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    next();
  } catch (error) {
    logger.error(error, "Auth error:");
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Middleware to check if user is admin of the publication
const requireAdmin = async (req, res, next) => {
  try {
    const { publicationId } = req.params;
    const userId = req.user.id;

    // First check if user is the publication owner (fallback for legacy publications)
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      return res.status(404).json({ error: "Publication not found" });
    }

    let isAdmin = false;
    let isOwner = pub.userId === userId;

    // Check if user is an admin member
    const member = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, parseInt(publicationId)),
          eq(publicationMember.userId, userId),
          eq(publicationMember.role, "admin"),
        ),
      );

    if (member.length > 0) {
      isAdmin = true;
    } else if (isOwner) {
      // If user is the publication owner but not in members table, add them as admin
      logger.info(
        `Adding publication owner as admin member: ${userId} for publication ${publicationId}`,
      );

      await db.insert(publicationMember).values({
        publicationId: parseInt(publicationId),
        userId: userId,
        role: "admin",
        invitedBy: userId,
      });

      isAdmin = true;
    }

    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    logger.error(error, "Admin check error:");
    res.status(500).json({ error: "Failed to verify admin access" });
  }
};

// Middleware to check if user can invite members (Admin or Editor)
const requireCanInvite = async (req, res, next) => {
  try {
    const { publicationId } = req.params;
    const userId = req.user.id;

    // First check if user is the publication owner
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      return res.status(404).json({ error: "Publication not found" });
    }

    let canInvite = false;
    let isOwner = pub.userId === userId;
    let userRole = null;

    // Check if user is an admin or editor member
    const [member] = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, parseInt(publicationId)),
          eq(publicationMember.userId, userId),
        ),
      );

    if (member) {
      userRole = member.role;
      // Both admin and editor can invite members
      if (member.role === "admin" || member.role === "editor") {
        canInvite = true;
      }
    } else if (isOwner) {
      // If user is the publication owner but not in members table, add them as admin
      logger.info(
        `Adding publication owner as admin member: ${userId} for publication ${publicationId}`,
      );

      await db.insert(publicationMember).values({
        publicationId: parseInt(publicationId),
        userId: userId,
        role: "admin",
        invitedBy: userId,
      });

      canInvite = true;
      userRole = "admin";
    }

    if (!canInvite) {
      return res
        .status(403)
        .json({ error: "Admin or Editor access required to invite members" });
    }

    // Store user role on request for later use (e.g., to restrict editor from inviting editor)
    req.userRole = userRole;
    next();
  } catch (error) {
    logger.error(error, "Invite permission check error:");
    res.status(500).json({ error: "Failed to verify invite permission" });
  }
};

// Middleware to check if user can remove members (Admin or Editor)
const requireCanRemove = async (req, res, next) => {
  try {
    const { publicationId } = req.params;
    const userId = req.user.id;

    // First check if user is the publication owner
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      return res.status(404).json({ error: "Publication not found" });
    }

    let canRemove = false;
    let isOwner = pub.userId === userId;
    let userRole = null;

    // Check if user is an admin or editor member
    const [member] = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, parseInt(publicationId)),
          eq(publicationMember.userId, userId),
        ),
      );

    if (member) {
      userRole = member.role;
      // Both admin and editor can remove members
      if (member.role === "admin" || member.role === "editor") {
        canRemove = true;
      }
    } else if (isOwner) {
      // If user is the publication owner but not in members table, add them as admin
      logger.info(
        `Adding publication owner as admin member: ${userId} for publication ${publicationId}`,
      );

      await db.insert(publicationMember).values({
        publicationId: parseInt(publicationId),
        userId: userId,
        role: "admin",
        invitedBy: userId,
      });

      canRemove = true;
      userRole = "admin";
    }

    if (!canRemove) {
      return res
        .status(403)
        .json({ error: "Admin or Editor access required to remove members" });
    }

    // Store user role on request for later use
    req.userRole = userRole;
    next();
  } catch (error) {
    logger.error(error, "Remove permission check error:");
    res.status(500).json({ error: "Failed to verify remove permission" });
  }
};

// Get all members of a publication
router.get("/:publicationId/members", getCurrentUser, async (req, res) => {
  try {
    const { publicationId } = req.params;
    const userId = req.user.id;

    // First check if user is the publication owner (fallback for legacy publications)
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, parseInt(publicationId)));

    if (!pub) {
      return res.status(404).json({ error: "Publication not found" });
    }

    let userRole = null;
    let isOwner = pub.userId === userId;

    // Check if user is a member of this publication
    const userMember = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, parseInt(publicationId)),
          eq(publicationMember.userId, userId),
        ),
      );

    if (userMember.length > 0) {
      userRole = userMember[0].role;
    } else if (isOwner) {
      // If user is the publication owner but not in members table, add them as admin
      logger.info(
        `Adding publication owner as admin member: ${userId} for publication ${publicationId}`,
      );

      await db.insert(publicationMember).values({
        publicationId: parseInt(publicationId),
        userId: userId,
        role: "admin",
        invitedBy: userId,
      });

      userRole = "admin";
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    const isAdmin = userRole === "admin";
    const canManageInvites = userRole === "admin" || userRole === "editor";

    // Get all active members
    const members = await db
      .select({
        id: publicationMember.id,
        userId: publicationMember.userId,
        role: publicationMember.role,
        joinedAt: publicationMember.joinedAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(publicationMember)
      .innerJoin(user, eq(publicationMember.userId, user.id))
      .where(eq(publicationMember.publicationId, parseInt(publicationId)));

    // Deduplicate members by userId (in case there are duplicates in the database)
    const uniqueMembers = [];
    const seenUserIds = new Set();
    for (const member of members) {
      if (!seenUserIds.has(member.userId)) {
        seenUserIds.add(member.userId);
        uniqueMembers.push(member);
      }
    }

    // If admin or editor, also get pending invitations
    let pendingInvitations = [];
    if (canManageInvites) {
      pendingInvitations = await db
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
        })
        .from(invitation)
        .where(
          and(
            eq(invitation.publicationId, parseInt(publicationId)),
            or(
              eq(invitation.status, "pending"),
              eq(invitation.status, "expired"),
              eq(invitation.status, "declined"),
            ),
          ),
        );
    }

    res.json({
      members: uniqueMembers,
      pendingInvitations: canManageInvites ? pendingInvitations : [],
      userRole: userRole,
    });
  } catch (error) {
    logger.error(error, "Error fetching members:");
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// Send invitation (Admin or Editor with restrictions)
router.post(
  "/:publicationId/invite",
  getCurrentUser,
  requireCanInvite,
  async (req, res) => {
    try {
      const { publicationId } = req.params;
      const { email, role } = req.body;
      const inviterId = req.user.id;

      if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
      }

      if (!["editor", "author"].includes(role)) {
        return res
          .status(400)
          .json({ error: "Invalid role. Must be 'editor' or 'author'" });
      }

      // Editors can only invite authors, not other editors
      if (req.userRole === "editor" && role === "editor") {
        return res
          .status(403)
          .json({ error: "Editors cannot invite other editors" });
      }

      // Check if user is already a member
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, email));

      if (existingUser.length > 0) {
        const existingMember = await db
          .select()
          .from(publicationMember)
          .where(
            and(
              eq(publicationMember.publicationId, parseInt(publicationId)),
              eq(publicationMember.userId, existingUser[0].id),
            ),
          );

        if (existingMember.length > 0) {
          return res
            .status(400)
            .json({ error: "User is already a member of this publication" });
        }
      }

      // Check if there's already a pending invitation
      const existingInvitation = await db
        .select()
        .from(invitation)
        .where(
          and(
            eq(invitation.publicationId, parseInt(publicationId)),
            eq(invitation.email, email),
            eq(invitation.status, "pending"),
          ),
        );

      if (existingInvitation.length > 0) {
        return res
          .status(400)
          .json({ error: "Invitation already sent to this email" });
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation
      const [newInvitation] = await db
        .insert(invitation)
        .values({
          publicationId: parseInt(publicationId),
          inviterId,
          email,
          role,
          token,
          expiresAt,
        })
        .returning();

      // Get publication details for email
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(publicationId)));

      // Send invitation email
      let emailSent = true;
      try {
        await sendInvitationEmail(email, pub.name, role, token, req.user.name);
      } catch (emailError) {
        logger.error(emailError, "Failed to send invitation email:");
        emailSent = false;
        // Still continue since the invitation was created in the database
      }

      // Create notification if user exists
      if (existingUser.length > 0) {
        try {
          await notificationService.notifyInvitation({
            userId: existingUser[0].id,
            publicationName: pub.name,
            inviterName: req.user.name,
            inviterId: req.user.id,
            publicationId: parseInt(publicationId),
          });
        } catch (notifError) {
          logger.error(notifError, "Failed to create notification:");
        }
      }

      res.status(201).json({
        message: emailSent
          ? "Invitation sent successfully"
          : "Invitation created but email failed to send. You can resend it later.",
        invitation: {
          id: newInvitation.id,
          email: newInvitation.email,
          role: newInvitation.role,
          status: newInvitation.status,
          createdAt: newInvitation.createdAt,
          expiresAt: newInvitation.expiresAt,
        },
        emailSent,
      });
    } catch (error) {
      logger.error(error, "Error sending invitation:");
      res.status(500).json({ error: "Failed to send invitation" });
    }
  },
);

// Resend invitation (Admin only)
router.post(
  "/:publicationId/invite/:invitationId/resend",
  getCurrentUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { publicationId, invitationId } = req.params;

      // Get invitation
      const [invite] = await db
        .select()
        .from(invitation)
        .where(
          and(
            eq(invitation.id, parseInt(invitationId)),
            eq(invitation.publicationId, parseInt(publicationId)),
          ),
        );

      if (!invite) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invite.status === "accepted") {
        return res.status(400).json({ error: "Invitation already accepted" });
      }

      // Update expiration date
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db
        .update(invitation)
        .set({
          status: "pending",
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(invitation.id, parseInt(invitationId)));

      // Get publication details
      const [pub] = await db
        .select()
        .from(publication)
        .where(eq(publication.id, parseInt(publicationId)));

      // Resend email
      try {
        await sendInvitationEmail(
          invite.email,
          pub.name,
          invite.role,
          invite.token,
          req.user.name,
        );
      } catch (emailError) {
        logger.error(emailError, "Failed to resend invitation email:");
        // Still return success since the invitation was updated in the database
      }

      res.json({ message: "Invitation resent successfully" });
    } catch (error) {
      logger.error(error, "Error resending invitation:");
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  },
);

// Cancel invitation (Admin or Editor with restrictions)
router.delete(
  "/:publicationId/invite/:invitationId",
  getCurrentUser,
  requireCanRemove,
  async (req, res) => {
    try {
      const { publicationId, invitationId } = req.params;

      // Get the invitation to check its role
      const [invite] = await db
        .select()
        .from(invitation)
        .where(
          and(
            eq(invitation.id, parseInt(invitationId)),
            eq(invitation.publicationId, parseInt(publicationId)),
          ),
        );

      if (!invite) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      // Editors can only cancel author invitations, not editor invitations
      if (req.userRole === "editor" && invite.role === "editor") {
        return res
          .status(403)
          .json({ error: "Editors cannot cancel editor invitations" });
      }

      const result = await db
        .delete(invitation)
        .where(
          and(
            eq(invitation.id, parseInt(invitationId)),
            eq(invitation.publicationId, parseInt(publicationId)),
          ),
        )
        .returning();

      res.json({ message: "Invitation cancelled successfully" });
    } catch (error) {
      logger.error(error, "Error cancelling invitation:");
      res.status(500).json({ error: "Failed to cancel invitation" });
    }
  },
);

// Remove member (Admin or Editor with restrictions)
router.delete(
  "/:publicationId/members/:memberId",
  getCurrentUser,
  requireCanRemove,
  async (req, res) => {
    try {
      const { publicationId, memberId } = req.params;

      // Get the member to be removed
      const [member] = await db
        .select()
        .from(publicationMember)
        .where(eq(publicationMember.id, parseInt(memberId)));

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Don't allow removing admin
      if (member.role === "admin") {
        return res.status(400).json({ error: "Cannot remove admin member" });
      }

      // Editors can only remove authors, not other editors
      if (req.userRole === "editor" && member.role === "editor") {
        return res
          .status(403)
          .json({ error: "Editors cannot remove other editors" });
      }

      const result = await db
        .delete(publicationMember)
        .where(
          and(
            eq(publicationMember.id, parseInt(memberId)),
            eq(publicationMember.publicationId, parseInt(publicationId)),
          ),
        )
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Get removed member details
      const [removedUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, member.userId));

      // Notify the removed member
      if (removedUser) {
        try {
          const [pub] = await db
            .select()
            .from(publication)
            .where(eq(publication.id, parseInt(publicationId)));

          await notificationService.createNotification({
            userId: removedUser.id,
            type: "member_removed",
            title: pub.name,
            message: "You have been removed from this publication.",
            relatedUserId: req.user.id, // Add the admin who removed them
            relatedPublicationId: parseInt(publicationId),
            relatedBlogId: null,
          });
        } catch (notifError) {
          logger.error(notifError, "Failed to create notification:");
        }
      }

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      logger.error(error, "Error removing member:");
      res.status(500).json({ error: "Failed to remove member" });
    }
  },
);

// Get user's publications (owned + joined)
router.get("/user/publications", getCurrentUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get owned publications
    const ownedPublications = await db
      .select({
        id: publication.id,
        name: publication.name,
        subdomain: publication.subdomain,
        description: publication.description,
        logoUrl: publication.logoUrl,
        createdAt: publication.createdAt,
      })
      .from(publication)
      .where(eq(publication.userId, userId));

    // Get the IDs of owned publications to exclude from joined list
    const ownedPublicationIds = ownedPublications.map((pub) => pub.id);

    // Add metadata for owned publications
    const ownedWithMeta = ownedPublications.map((pub) => ({
      ...pub,
      isOwner: true,
      role: "admin",
      joinedAt: pub.createdAt,
    }));

    // Get joined publications (where user is a member but NOT the owner)
    const joinedPublications = await db
      .select({
        id: publication.id,
        name: publication.name,
        subdomain: publication.subdomain,
        description: publication.description,
        logoUrl: publication.logoUrl,
        createdAt: publication.createdAt,
        role: publicationMember.role,
        joinedAt: publicationMember.joinedAt,
        ownerId: publication.userId,
      })
      .from(publicationMember)
      .innerJoin(
        publication,
        eq(publicationMember.publicationId, publication.id),
      )
      .where(eq(publicationMember.userId, userId));

    // Filter out publications where user is the owner (they should only appear in owned list)
    const filteredJoinedPublications = joinedPublications.filter(
      (pub) => pub.ownerId !== userId,
    );

    // Add metadata for joined publications
    const joinedWithMeta = filteredJoinedPublications.map((pub) => {
      const { ownerId, ...rest } = pub; // Remove ownerId from response
      return {
        ...rest,
        isOwner: false,
      };
    });

    // Combine both arrays
    const allPublications = [...ownedWithMeta, ...joinedWithMeta];

    res.json({
      publications: allPublications,
      ownedCount: ownedWithMeta.length,
      joinedCount: joinedWithMeta.length,
    });
  } catch (error) {
    logger.error(error, "Error fetching user publications:");
    res.status(500).json({ error: "Failed to fetch user publications" });
  }
});

// Leave publication (Non-admin members only)
router.post("/:publicationId/leave", getCurrentUser, async (req, res) => {
  try {
    const { publicationId } = req.params;
    const userId = req.user.id;

    // Get user's membership
    const [member] = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, parseInt(publicationId)),
          eq(publicationMember.userId, userId),
        ),
      );

    if (!member) {
      return res
        .status(404)
        .json({ error: "You are not a member of this publication" });
    }

    if (member.role === "admin") {
      return res.status(400).json({
        error: "Admin cannot leave publication. Transfer ownership first.",
      });
    }

    await db
      .delete(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, parseInt(publicationId)),
          eq(publicationMember.userId, userId),
        ),
      );

    res.json({ message: "Successfully left the publication" });
  } catch (error) {
    logger.error(error, "Error leaving publication:");
    res.status(500).json({ error: "Failed to leave publication" });
  }
});

// Get invitation details (requires authentication)
router.get("/invite/:token", getCurrentUser, async (req, res) => {
  try {
    const { token } = req.params;

    // Get invitation
    const [invite] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.token, token));

    if (!invite) {
      return res.status(404).json({ error: "Invalid invitation link" });
    }

    // Check if invitation is still valid
    if (invite.status !== "pending") {
      return res.status(400).json({
        error: "Invitation is no longer valid",
        status: invite.status,
      });
    }

    if (new Date() > invite.expiresAt) {
      // Mark as expired
      await db
        .update(invitation)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(invitation.id, invite.id));

      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Check if user email matches invitation email
    if (req.user.email !== invite.email) {
      return res.status(400).json({
        error: "This invitation was sent to a different email address",
        invitedEmail: invite.email,
        yourEmail: req.user.email,
      });
    }

    // Get publication details
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, invite.publicationId));

    if (!pub) {
      return res.status(404).json({ error: "Publication not found" });
    }

    // Get inviter details
    const [inviter] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, invite.inviterId));

    res.json({
      invitation: {
        id: invite.id,
        role: invite.role,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
      },
      publication: {
        id: pub.id,
        name: pub.name,
        subdomain: pub.subdomain,
        description: pub.description,
        logoUrl: pub.logoUrl,
      },
      inviter: inviter || null,
    });
  } catch (error) {
    logger.error(error, "Error fetching invitation details:");
    res.status(500).json({ error: "Failed to fetch invitation details" });
  }
});

// Accept invitation
router.post("/invite/:token/accept", getCurrentUser, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    logger.info(
      `[Invitation Accept] User ${userId} attempting to accept invitation`,
    );

    // Get invitation
    const [invite] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.token, token));

    if (!invite) {
      logger.info(`[Invitation Accept] Invalid token: ${token}`);
      return res.status(404).json({ error: "Invalid invitation link" });
    }

    logger.info(
      `[Invitation Accept] Found invitation ID: ${invite.id}, email: ${invite.email}, status: ${invite.status}`,
    );

    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Invitation is no longer valid" });
    }

    if (new Date() > invite.expiresAt) {
      // Mark as expired
      await db
        .update(invitation)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(invitation.id, invite.id));

      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Check if user email matches invitation email
    if (req.user.email !== invite.email) {
      logger.info(
        `[Invitation Accept] Email mismatch: user=${req.user.email}, invite=${invite.email}`,
      );
      return res.status(400).json({
        error: "This invitation was sent to a different email address",
      });
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(publicationMember)
      .where(
        and(
          eq(publicationMember.publicationId, invite.publicationId),
          eq(publicationMember.userId, userId),
        ),
      );

    if (existingMember.length > 0) {
      return res
        .status(400)
        .json({ error: "You are already a member of this publication" });
    }

    logger.info(
      `[Invitation Accept] Adding user as ${invite.role} to publication ${invite.publicationId}`,
    );

    // Accept invitation in transaction
    const result = await db.transaction(async (tx) => {
      // Add user as member
      await tx.insert(publicationMember).values({
        publicationId: invite.publicationId,
        userId,
        role: invite.role,
        invitedBy: invite.inviterId,
      });

      // Mark invitation as accepted
      await tx
        .update(invitation)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invitation.id, invite.id));

      // Get the publication data to return
      const [joinedPublication] = await tx
        .select({
          id: publication.id,
          name: publication.name,
          subdomain: publication.subdomain,
          description: publication.description,
          logoUrl: publication.logoUrl,
          createdAt: publication.createdAt,
        })
        .from(publication)
        .where(eq(publication.id, invite.publicationId));

      return {
        ...joinedPublication,
        role: invite.role,
        memberCount: 1,
        postCount: 0,
      };
    });

    logger.info(
      `[Invitation Accept] Success! User ${userId} joined publication ${invite.publicationId}`,
    );

    // Get publication details for notification
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, invite.publicationId));

    // Notify publication owner that member joined
    try {
      await notificationService.notifyMemberJoined({
        ownerId: pub.userId,
        memberName: req.user.name,
        memberId: userId,
        publicationId: invite.publicationId,
      });
    } catch (notifError) {
      logger.error(notifError, "Failed to create notification:");
    }

    res.json({
      message: "Invitation accepted successfully",
      publication: result,
    });
  } catch (error) {
    logger.error(error, "Error accepting invitation:");
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// Decline invitation
router.post("/invite/:token/decline", getCurrentUser, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    logger.info(
      `[Invitation Decline] User ${userId} (${req.user.email}) attempting to decline invitation with token: ${token}`,
    );

    // Get invitation
    const [invite] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.token, token));

    if (!invite) {
      logger.info(`[Invitation Decline] Invalid token: ${token}`);
      return res.status(404).json({ error: "Invalid invitation link" });
    }

    logger.info(
      `[Invitation Decline] Found invitation ID: ${invite.id}, email: ${invite.email}, status: ${invite.status}`,
    );

    if (invite.status !== "pending") {
      logger.info(
        `[Invitation Decline] Invitation not pending, status: ${invite.status}`,
      );
      return res.status(400).json({ error: "Invitation is no longer valid" });
    }

    // Check if user email matches invitation email
    if (req.user.email !== invite.email) {
      logger.info(
        `[Invitation Decline] Email mismatch: user=${req.user.email}, invite=${invite.email}`,
      );
      return res.status(400).json({
        error: "This invitation was sent to a different email address",
      });
    }

    // Mark invitation as declined
    await db
      .update(invitation)
      .set({
        status: "declined",
        updatedAt: new Date(),
      })
      .where(eq(invitation.id, invite.id));

    logger.info(
      `[Invitation Decline] Invitation ${invite.id} marked as declined`,
    );

    // Get publication details for notification
    const [pub] = await db
      .select()
      .from(publication)
      .where(eq(publication.id, invite.publicationId));

    if (!pub) {
      logger.error(
        `[Invitation Decline] Publication not found: ${invite.publicationId}`,
      );
      return res.json({ message: "Invitation declined" });
    }

    logger.info(
      `[Invitation Decline] Publication found: ${pub.name}, Owner: ${pub.userId}`,
    );
    logger.info(
      `[Invitation Decline] Creating notification for publication owner ${pub.userId}`,
    );
    logger.info(
      `[Invitation Decline] Decliner name: ${req.user.name}, Decliner ID: ${userId}`,
    );

    // Notify publication owner that invitation was declined
    try {
      const notification = await notificationService.notifyInvitationDeclined({
        ownerId: pub.userId, // Notify the publication owner
        memberName: req.user.name,
        memberId: userId,
        publicationId: invite.publicationId,
      });
      logger.info(
        `[Invitation Decline] Notification created successfully: ${JSON.stringify(notification)}`,
      );
    } catch (notifError) {
      logger.error(
        notifError,
        "[Invitation Decline] Failed to create notification:",
      );
    }

    res.json({ message: "Invitation declined" });
  } catch (error) {
    logger.error("[Invitation Decline] Error declining invitation:");
    res.status(500).json({ error: "Failed to decline invitation" });
  }
});

// Helper function to send invitation email
async function sendInvitationEmail(
  email,
  publicationName,
  role,
  token,
  inviterName,
) {
  try {
    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const acceptUrl = `${process.env.FRONTEND_URL}/invite/${token}`;
    const declineUrl = `${process.env.FRONTEND_URL}/invite/${token}/decline`;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `You're invited to join ${publicationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're invited to join ${publicationName}</h2>
          <p>Hi there!</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${publicationName}</strong> as a <strong>${role}</strong>.</p>
          
          <div style="margin: 30px 0;">
            <a href="${acceptUrl}" style="background-color: #3400A3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">Accept Invitation</a>
            <a href="${declineUrl}" style="background-color: #6B7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Decline</a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px;">This invitation will expire in 7 days.</p>
          <p style="color: #6B7280; font-size: 14px;">If you can't click the buttons above, copy and paste these links:</p>
          <p style="color: #6B7280; font-size: 12px;">Accept: ${acceptUrl}</p>
          <p style="color: #6B7280; font-size: 12px;">Decline: ${declineUrl}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Invitation email sent to ${email}`);
  } catch (error) {
    logger.error(error, "Error sending invitation email:");
    throw error;
  }
}

export default router;
