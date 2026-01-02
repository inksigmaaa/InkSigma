// routes/debugRoutes.js
import express from "express";
import { authService } from "../services/authService.js";

const router = express.Router();

// GET /api/debug/users
router.get("/users", async (req, res) => {
    try {
        const users = await authService.getAllUsers();
        res.json({ count: users.length, users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/debug/cleanup-unverified
router.get("/cleanup-unverified", async (req, res) => {
    try {
        const deletedCount = await authService.cleanupUnverifiedUsers();
        res.json({ 
            success: true, 
            message: `Cleaned up ${deletedCount} unverified users` 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
