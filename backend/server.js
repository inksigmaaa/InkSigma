// server.js
import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import authRoutes from "./routes/authRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import { corsMiddleware } from "./middleware/cors.js";
import { emailService } from "./services/emailService.js";
import schedulerService from "./services/schedulerService.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(corsMiddleware);



// Parse JSON bodies
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Better Auth handler - handles /api/auth/*
app.use("/api/auth", toNodeHandler(auth));

// Custom auth routes - handles /api/custom/*
app.use("/api/custom", authRoutes);

// Profile routes - handles /api/profile/*
app.use("/api/profile", profileRoutes);

// Blog routes - handles /api/blogs/*
app.use("/api/blogs", blogRoutes);

// Publication routes - handles /api/publications/*
app.use("/api/publications", publicationRoutes);

// Debug routes (remove in production)
app.use("/api/debug", debugRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Verify SMTP connection on startup
    const smtpReady = await emailService.verify();
    if (!smtpReady) {
        console.error("⚠️  WARNING: SMTP is not configured properly. Emails will not be sent!");
        console.error("   Check your SMTP_USER and SMTP_PASS in .env file");
    }
    
    // Start the blog scheduler
    schedulerService.start();
    console.log("📅 Blog scheduler started - checking for scheduled posts every minute");
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    schedulerService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    schedulerService.stop();
    process.exit(0);
});
