import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { auth } from "./auth/index.js";
import { toNodeHandler } from "better-auth/node";
import publicationRoutes from "./routes/publication.js";
import userRoutes from "./routes/user.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Better Auth routes
app.all("/api/auth/*", toNodeHandler(auth));

// API routes
app.use("/api/publication", publicationRoutes);
app.use("/api/user", userRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📧 Auth routes available at http://localhost:${PORT}/api/auth/*`);
    console.log(`📚 Publication routes available at http://localhost:${PORT}/api/publication/*`);
    console.log(`👤 User routes available at http://localhost:${PORT}/api/user/*`);
});
