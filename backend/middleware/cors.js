// middleware/cors.js
import cors from "cors";

export const corsMiddleware = cors({
<<<<<<< HEAD
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});
=======
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
});
>>>>>>> 1613a9b42c2fa6dec5a2057df2dbcaf648acdda7
