import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/betterAuth.js";
import authRoutes from "./routes/authRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import emailDebugRoutes from "./routes/emailDebugRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import publicationMemberRoutes from "./routes/publicationMemberRoutes.js";
import publicationStatsRoutes from "./routes/publicationStatsRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import resendVerificationRoutes from "./routes/resendVerificationRoutes.js";
import { corsMiddleware } from "./middleware/cors.js";
import { emailService } from "./services/emailService.js";
import schedulerService from "./services/schedulerService.js";
import InvitationService from "./services/invitationService.js";
import { runMigrations } from "./config/migrate.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Static file serving
app.use("/uploads", express.static("uploads"));

// Authentication routes
console.log("Mounting better-auth handler at /api/auth");
try {
    const authHandler = toNodeHandler(auth);
    app.use("/api/auth", authHandler);
    console.log("✅ Better-auth handler mounted successfully");
} catch (error) {
    console.error("❌ Error mounting better-auth handler:", error);
}

// API routes
app.use("/api/custom", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/publication-members", publicationMemberRoutes);
app.use("/api/publication-stats", publicationStatsRoutes);
app.use("/api/members", memberRoutes);
app.use("/api", resendVerificationRoutes);

// Debug routes (consider removing in production)
app.use("/api/debug", debugRoutes);
app.use("/api/email-debug", emailDebugRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler - must be after all routes
app.use((err, req, res, next) => {
    console.error("Global error handler caught:", err);
    console.error("Error stack:", err.stack);
    
    // Don't send response if headers already sent
    if (res.headersSent) {
        return next(err);
    }
    
    res.status(err.status || 500).json({ 
        error: err.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Run database migrations automatically
    try {
        await runMigrations();
    } catch (error) {
        console.error("Failed to run migrations. Server will continue but database may be out of sync.");
    }
    
    // Verify SMTP connection
    const smtpReady = await emailService.verify();
    if (!smtpReady) {
        console.error("⚠️  WARNING: SMTP not configured properly. Emails will not be sent!");
        console.error("   Check SMTP_USER and SMTP_PASS in .env file");
    }
    
    // Initialize scheduler
    app.locals.schedulerService = schedulerService;
    schedulerService.start();
    
    // Initialize invitation cleanup
    InvitationService.startScheduler();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    schedulerService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n Shutting down server...');
    schedulerService.stop();
    process.exit(0);
});
