// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import authRoutes from "./routes/authRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";

const app = express();

// CORS middleware
const corsMiddleware = cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
});

// Middleware
app.use(corsMiddleware);

// Better Auth routes (must be before express.json)
const authHandler = toNodeHandler(auth);
app.use((req, res, next) => {
    if (req.path.startsWith("/api/auth")) {
        console.log(`[BETTER-AUTH] ${req.method} ${req.path}`);
        return authHandler(req, res);
    }
    next();
});

// Parse JSON
app.use(express.json());

// Routes
app.use("/api/custom", authRoutes);
app.use("/api/debug", debugRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});