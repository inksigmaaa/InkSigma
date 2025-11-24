import express from "express";
import { db } from "../db/index.js";
import { user } from "../db/schema.js";
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

// Update user profile
router.post("/update-profile", verifySession, async (req, res) => {
    try {
        const { name, username, bio } = req.body;

        const updateData = {
            name: name || req.user.name,
            username: username || null,
            bio: bio || null,
            updatedAt: new Date(),
        };

        const result = await db
            .update(user)
            .set(updateData)
            .where(eq(user.id, req.user.id))
            .returning();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: result[0],
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

export default router;
