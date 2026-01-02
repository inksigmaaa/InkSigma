// server.js
import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { corsMiddleware } from "./middleware/cors.js";
import { auth } from "./config/betterAuth.js";
import authRoutes from "./routes/authRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import { emailService } from "./services/emailService.js";

const app = express();

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
const PORT = process.env.PORT;
app.listen(PORT, async () => {
    console.log(` Server running on http://localhost:${PORT}`);
   
    
});