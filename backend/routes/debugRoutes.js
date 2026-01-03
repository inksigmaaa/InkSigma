// routes/debugRoutes.js
import express from "express";
import { authService } from "../services/authService.js";

const router = express.Router();

// Debug route to check all users
router.get("/users", async (req, res) => {
    try {
        const users = await authService.getAllUsers();
        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("[DEBUG] Error fetching users:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Debug route to cleanup unverified users
router.post("/cleanup", async (req, res) => {
    try {
        const deletedCount = await authService.cleanupUnverifiedUsers();
        res.json({
            success: true,
            message: `Cleaned up ${deletedCount} unverified users`,
            deletedCount,
        });
    } catch (error) {
        console.error("[DEBUG] Error during cleanup:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
