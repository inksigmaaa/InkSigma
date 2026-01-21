import cors from "cors";

// CORS configuration
export const corsMiddleware = cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
    ],
    credentials: true,
});
