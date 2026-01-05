// server.js
import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import authRoutes from "./routes/authRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { corsMiddleware } from "./middleware/cors.js";


const app = express();
const PORT = process.env.PORT || 5000;


// Parse JSON bodies
app.use(express.json());

app.use(corsMiddleware)// Serve uploaded files
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
    console.log(`Server running on http://localhost:${PORT}`);
  
});
