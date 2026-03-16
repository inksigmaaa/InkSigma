// routes/publicationMemberRoutes.js
import express from "express";
import { db } from "../config/database.js";
import { publicationMember, publication, user } from "../models/schema.js";
import { eq, and } from "drizzle-orm";
import { auth } from "../config/betterAuth.js";
import { fromNodeHeaders } from "better-auth/node";
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

// GET /api/publication-members/my-publications - Get publications where user is a member
router.get("/my-publications", getCurrentUser, async (req, res) => {
    try {
        const memberships = await db
            .select({
                id: publicationMember.id,
                role: publicationMember.role,
                publication: {
                    id: publication.id,
                    name: publication.name,
                    subdomain: publication.subdomain,
                    customDomain: publication.customDomain,
                    description: publication.description,
                    logoUrl: publication.logoUrl,
                    userId: publication.userId
                }
            })
            .from(publicationMember)
            .leftJoin(publication, eq(publicationMember.publicationId, publication.id))
            .where(eq(publicationMember.userId, req.user.id));

        // Transform to match frontend expectations
        const publications = memberships.map(membership => ({
            id: membership.publication.id,
            name: membership.publication.name,
            subdomain: membership.publication.subdomain,
            customDomain: membership.publication.customDomain,
            description: membership.publication.description,
            logoUrl: membership.publication.logoUrl,
            role: membership.role,
            isOwner: membership.publication.userId === req.user.id,
            membershipId: membership.id
        }));

        res.json(publications);
    } catch (error) {
        logger.error(error, "Error fetching user publications:");
        res.status(500).json({ error: "Failed to fetch publications" });
    }
});

// GET /api/publication-members/:publicationId/members - Get all members of a publication
router.get("/:publicationId/members", getCurrentUser, async (req, res) => {
    try {
        const { publicationId } = req.params;

        const members = await db
            .select({
                id: publicationMember.id,
                role: publicationMember.role,
                createdAt: publicationMember.createdAt,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    username: user.username
                }
            })
            .from(publicationMember)
            .leftJoin(user, eq(publicationMember.userId, user.id))
            .where(eq(publicationMember.publicationId, parseInt(publicationId)));

        res.json(members);
    } catch (error) {
        logger.error(error, "Error fetching publication members:");
        res.status(500).json({ error: "Failed to fetch members" });
    }
});

// POST /api/publication-members - Add member to publication (owner only)
router.post("/", getCurrentUser, async (req, res) => {
    try {
        const { publicationId, userId, role = "author" } = req.body;

        if (!publicationId || !userId) {
            return res.status(400).json({ error: "Publication ID and User ID are required" });
        }

        // Check if current user is the owner of the publication
        const [pub] = await db
            .select()
            .from(publication)
            .where(eq(publication.id, parseInt(publicationId)));

        if (!pub) {
            return res.status(404).json({ error: "Publication not found" });
        }

        if (pub.userId !== req.user.id) {
            return res.status(403).json({ error: "Only publication owner can add members" });
        }

        // Check if user is already a member
        const [existing] = await db
            .select()
            .from(publicationMember)
            .where(
                and(
                    eq(publicationMember.publicationId, parseInt(publicationId)),
                    eq(publicationMember.userId, userId)
                )
            );

        if (existing) {
            return res.status(400).json({ error: "User is already a member" });
        }

        const [newMember] = await db
            .insert(publicationMember)
            .values({
                publicationId: parseInt(publicationId),
                userId,
                role,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        res.status(201).json(newMember);
    } catch (error) {
        logger.error(error, "Error adding publication member:");
        res.status(500).json({ error: "Failed to add member" });
    }
});

// DELETE /api/publication-members/:id - Remove member from publication (owner only)
router.delete("/:id", getCurrentUser, async (req, res) => {
    try {
        const { id } = req.params;

        // Get the membership
        const [membership] = await db
            .select()
            .from(publicationMember)
            .where(eq(publicationMember.id, parseInt(id)));

        if (!membership) {
            return res.status(404).json({ error: "Membership not found" });
        }

        // Check if current user is the owner of the publication
        const [pub] = await db
            .select()
            .from(publication)
            .where(eq(publication.id, membership.publicationId));

        if (pub.userId !== req.user.id) {
            return res.status(403).json({ error: "Only publication owner can remove members" });
        }

        await db
            .delete(publicationMember)
            .where(eq(publicationMember.id, parseInt(id)));

        res.json({ success: true, message: "Member removed successfully" });
    } catch (error) {
        logger.error(error, "Error removing publication member:");
        res.status(500).json({ error: "Failed to remove member" });
    }
});

export default router;
