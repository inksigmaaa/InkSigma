import express from "express";
import { db } from "../db/index.js";
import { publication } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { auth } from "../auth/index.js";

const router = express.Router();

// Middleware to verify session
const verifySession = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.user = session.user;
        req.session = session;
        next();
    } catch (error) {
        console.error("Session verification error:", error);
        res.status(401).json({ error: "Unauthorized" });
    }
};

// Check if user has a publication
router.get("/check", verifySession, async (req, res) => {
    try {
        const userPublications = await db
            .select()
            .from(publication)
            .where(eq(publication.userId, req.user.id))
            .limit(1);

        res.json({
            hasPublication: userPublications.length > 0,
            authenticated: true,
        });
    } catch (error) {
        console.error("Error checking publication:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get user's publication
router.get("/", verifySession, async (req, res) => {
    try {
        const userPublication = await db
            .select()
            .from(publication)
            .where(eq(publication.userId, req.user.id))
            .limit(1);

        if (userPublication.length === 0) {
            return res.status(404).json({ error: "Publication not found" });
        }

        res.json({ publication: userPublication[0] });
    } catch (error) {
        console.error("Error fetching publication:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create publication
router.post("/", verifySession, async (req, res) => {
    try {
        const { name, subdomain, description, image } = req.body;

        if (!name || !subdomain) {
            return res.status(400).json({ error: "Name and subdomain are required" });
        }

        const newPublication = await db
            .insert(publication)
            .values({
                name,
                subdomain,
                description,
                image,
                userId: req.user.id,
            })
            .returning();

        res.status(201).json({ publication: newPublication[0] });
    } catch (error) {
        console.error("Error creating publication:", error);
        if (error.message.includes("unique")) {
            return res.status(400).json({ error: "Subdomain already exists" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update publication
router.put("/:id", verifySession, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, logoUrl, faviconUrl, metaOgImageUrl } = req.body;

        // Verify ownership
        const pub = await db
            .select()
            .from(publication)
            .where(eq(publication.id, parseInt(id)));

        if (pub.length === 0 || pub[0].userId !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const updated = await db
            .update(publication)
            .set({
                name,
                description,
                image,
                logoUrl,
                faviconUrl,
                metaOgImageUrl,
                updatedAt: new Date(),
            })
            .where(eq(publication.id, parseInt(id)))
            .returning();

        res.json({ publication: updated[0] });
    } catch (error) {
        console.error("Error updating publication:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
