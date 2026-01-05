// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import authRoutes from "./routes/authRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Better Auth handler - handles /api/auth/*
app.all("/api/auth/*", toNodeHandler(auth));

// Custom auth routes - handles /api/custom/*
app.use("/api/custom", authRoutes);

// Profile routes - handles /api/profile/*
app.use("/api/profile", profileRoutes);

// Debug routes (remove in production)
app.use("/api/debug", debugRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`🔧 Custom endpoints: http://localhost:${PORT}/api/custom`);
});
